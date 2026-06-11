SPEC · 章节 09

# JSON 引擎

Rust 端纯计算层 ── 先讲设计与算法机制，再列函数签名。所有 opts struct 字段定义见 [13 § 3.1](13_schemas.md)。

REF

本章描述 算法与设计； `FormatOpts` /`UnwrapOpts` /`StringifyOpts` /`JsonitaError::Parse / UnwrapTimeout` 字段定义见 [13 § 3.1 / § 1](13_schemas.md)。

一 · 设计

## 1 设计目标与边界

JSON 引擎是 纯计算层 ── 接收字符串、返回字符串或错误，不持有任何状态、不做任何 IO。这条规则比看起来更重要，它决定了整个系统的可测性与并发模型。

纯函数 ：所有 `engine::*` 函数签名形如 `fn(text: &str, opts) -> Result<String, JsonitaError>` 。不读 fs / net / db / 不打日志（错误通过 `JsonitaError` 上抛）

无 Tauri 依赖 ：engine 模块 `cargo test` 可独立跑，不需要 `tauri::AppHandle` 或任何 runtime context ── command 层负责拼装上下文

线程安全 ：所有函数 `Send + Sync` ，可在 `tokio::spawn_blocking` CPU 池任意并发调用，无 Mutex / Arc

错误位置一手保留 ：解析失败时 `line / col` 必须 1-indexed 且与用户视觉一致 ── 这是 CodeMirror linter 喂数据的硬要求

## 2 为何用 serde_json 而不是 nom / pest / 手写

| 方案 | format / 错误定位 | 体积 | 结论 |
| --- | --- | --- | --- |
| serde_json （选） | 原生支持， `e.line()` /`e.column()` 直出 | +0（Rust 生态默认） | Tauri / reqwest 已经依赖，零额外成本 |
| nom 手写 parser | 自定义 SourceLoc 跟踪，要写完整 JSON grammar | +200 KB 代码 | 没有任何 serde_json 不能做的事，纯造轮子 |
| pest grammar | 声明式语法 + AST，但错误定位需重组 | +150 KB（含 macro） | 过度工程 |
| simd-json | 主打吞吐，但 spec 不严格；错误位置粗糙 | +50 KB | v1 100KB / 50ms 用 serde_json 已达标，未来再换 |

额外要求： `Cargo.toml` 必须开启 `serde_json = { version = "1", features = ["preserve_order"] }` ── 默认 BTreeMap 排序会丢失用户输入顺序，对 Jsonita 这种"所见即所得"工具不可接受。开启后底层用 `IndexMap`，sort_keys 改用显式递归（见 § 4.2）。

## 3 模块划分

四个子模块按 算法职责 切分，互不依赖（除了都用 `error_loc` ）：

| 模块 | 职责 | 对外接口 |
| --- | --- | --- |
| `engine::json` | format / minify / sort_keys | `format` ·`minify` |
| `engine::unwrap` | 递归解开嵌套 stringified JSON | `unwrap` |
| `engine::stringify` | JSON ↔ string 字面量互转 | `json_to_string` ·`string_to_json` |
| `engine::error_loc` | serde_json 错误 →`JsonitaError::Parse` | `map` （私有 helper，仅 engine 内部使用） |

| 路径 | 说明 |
| --- | --- |
| `src-tauri/src/engine/mod.rs` | re-exports |
| `src-tauri/src/engine/json.rs` | format / minify |
| `src-tauri/src/engine/unwrap.rs` | 递归嵌套解开（带超时） |
| `src-tauri/src/engine/stringify.rs` | JSON ↔ String 互转 |
| `src-tauri/src/engine/error_loc.rs` | serde_json 错误 → JsonitaError::Parse |
| `src-tauri/src/engine/tests/` | 单测（无 Tauri 环境） |
| `src-tauri/src/engine/tests/format_tests.rs` | format / minify 用例 |
| `src-tauri/src/engine/tests/unwrap_tests.rs` | 嵌套解开用例 |
| `src-tauri/src/engine/tests/stringify_tests.rs` | JSON ↔ String 用例 |
| `src-tauri/src/engine/tests/fixtures/` | 各种 JSON 样本 |

二 · 算法机制

## 4 format 与 sort_keys

### 4.1 策略

format 走 Value 中转： `str → Value → PrettyFormatter → str。理由：`

不依赖输入是否合法 ：Value 阶段已校验，输出阶段必然合法

支持 sort_keys ：在 Value 上递归排序， `IndexMap` 重建

缩进可配 ： `PrettyFormatter::with_indent` 接受任意 byte slice ── 2 空格 / 4 空格 / tab 都用同一套

### 4.2 sort_keys 递归（核心 ~12 行）

由于开启 `preserve_order`， `Map` 底层是 `IndexMap`，没有内置 sort_keys。手写递归：

```
fn sort_keys_recursive(v: &mut Value) {
    match v {
        Value::Object(map) => {
            let mut keys: Vec<String> = map.keys().cloned().collect();
            keys.sort();
            let mut new_map = serde_json::Map::with_capacity(keys.len());
            for k in keys {
                let mut val = map.remove(&k).unwrap();
                sort_keys_recursive(&mut val);   // 先递归子树再插入
                new_map.insert(k, val);
            }
            *map = new_map;
        }
        Value::Array(arr) => arr.iter_mut().for_each(sort_keys_recursive),
        _ => {}
    }
}
```

注意：先递归再插入，确保深层 object 也排序。复杂度 O(n log n) per object（sort 占主导）。

## 5 错误位置定位

### 5.1 策略

serde_json 的 `Error` 自带 `line()` /`column()`，且 1-indexed 与用户视角一致 ── 我们只需 剥离重复后缀。原始错误信息形如：

```
"expected `,` or `}` at line 3 column 5"
```

处理：取 `" at line "` 之前的描述，给用户更短的提示文案。

### 5.2 map 函数（~10 行）

```
pub fn map(e: serde_json::Error) -> JsonitaError {
    let raw = e.to_string();
    let msg = raw.split(" at line ").next().unwrap_or(&raw).to_string();
    JsonitaError::Parse {
        line: e.line() as u32,
        col:  e.column() as u32,
        msg,
    }
}
```

### 5.3 常见错误分类（用户视角文案）

给 `msg` 字段加一层文案润色，让错误更易读 ── linter 用 `msg` 显示在状态栏右侧：

| 原始 serde 错误 | 润色后展示 |
| --- | --- |
| expected `,` or `}` | "expected ',' or '}'" |
| trailing comma | "trailing comma not allowed" |
| key must be a string | "key must be a string (use double quotes)" |
| EOF while parsing a string | "unterminated string" |
| expected value | "unexpected token, value required" |

## 6 嵌套 stringified JSON 全量解开

### 6.1 问题定义

来自 [plan/01 F3.3](../plan/01_features.md)：Go proto 序列化 / 网关包裹的 JSON 常常出现字段值本身又是 stringified JSON。一键递归解开是 Jsonita 最被需要的能力之一。

```
// before
{
  "code": 200,
  "data": "{\"name\":\"alice\"}",
  "extra": "{\"tags\":[\"a\",\"b\"]}"
}

// after
{
  "code": 200,
  "data": { "name": "alice" },
  "extra": { "tags": ["a", "b"] }
}
```

### 6.2 关键决策

| 决策 | 选择 | 理由 |
| --- | --- | --- |
| string 是数字 / bool 时是否解 | 不解（只解 object / array） | 避免破坏 `"123"` 这种业务上有意义的字符串（ID 等） |
| 解开后是否再递归 walk | 是 | 支持多层嵌套（如 4 层 proto wrap） |
| 遇到无法 parse 的 string | 静默跳过，保留原 string | 不是"修复"工具；无效字符串不该报错 |
| 超时单位 | walk 每次入口检查 `Instant`，不是按节点数 | 大对象遍历仍会卡死 ── 时间是唯一可靠护栏 |
| 层数限制 | 默认 `None` （无限制）；保留 `max_depth` 给测试 / 极端用例 | 真实 proto 嵌套 4-6 层是常态；不该截 |

### 6.3 walk 核心算法（~20 行）

```
pub fn unwrap(text: &str, opts: UnwrapOpts) -> Result<String, JsonitaError> {
    let deadline = Instant::now() + Duration::from_millis(opts.timeout_ms);
    let mut v: Value = serde_json::from_str(text).map_err(error_loc::map)?;
    walk(&mut v, deadline, opts.max_depth, 0)?;
    serde_json::to_string_pretty(&v).map_err(|e| JsonitaError::Io(e.to_string()))
}

fn walk(v: &mut Value, deadline: Instant, max_depth: Option<u32>, depth: u32)
    -> Result<(), JsonitaError>
{
    if Instant::now() >= deadline {
        return Err(JsonitaError::UnwrapTimeout { ms: 0, depth });
    }
    if let Some(md) = max_depth { if depth > md { return Ok(()); } }

    match v {
        Value::String(s) => {
            if let Ok(parsed) = serde_json::from_str::<Value>(s) {
                if matches!(parsed, Value::Object(_) | Value::Array(_)) {
                    *v = parsed;
                    walk(v, deadline, max_depth, depth + 1)?;   // 解开后再递归
                }
            }
        }
        Value::Object(map) => for (_, c) in map.iter_mut() { walk(c, deadline, max_depth, depth+1)?; }
        Value::Array(arr)  => for c in arr.iter_mut()        { walk(c, deadline, max_depth, depth+1)?; }
        _ => {}
    }
    Ok(())
}
```

### 6.4 边界用例（fixture 表）

| 用例 | 输入 | 预期 |
| --- | --- | --- |
| single level | `{"a":"{\"b\":1}"}` | `{"a":{"b":1}}` |
| double nested | `{"a":"{\"b\":\"{\\\"c\\\":1}\"}"}` | `{"a":{"b":{"c":1}}}` |
| array of stringified | `{"items":["{\"x\":1}","{\"x\":2}"]}` | `{"items":[{"x":1},{"x":2}]}` |
| non-json string stays | `{"label":"hello world"}` | 不变 |
| numeric string stays | `{"id":"12345"}` | 不变 |
| depth limit (maxDepth=1) | 双层嵌套 | 仅解第 1 层 |
| timeout (10ms + 大对象) | 故意构造慢用例 | `Err(UnwrapTimeout)` |

## 7 JSON ↔ String 互转

### 7.1 设计意图

面向 把 JSON 嵌入到代码 / 配置 / SQL 字面量 的场景。两个方向：

`json_to_string` ：JSON → 用 quote 包裹 + 内部转义。可选择 double / single quote ── 单引号适合 SQL / YAML，双引号适合 JS / Python

`string_to_json` ：去外层 quote + 反转义 + 验证 → 美化输出。容忍输入有无外层 quote

### 7.2 转义规则

| 字符 | 转义形式 | 备注 |
| --- | --- | --- |
| `\` | `\\` | 必须最先处理（否则会被后续规则破坏） |
| quote 字符（依 opts） | `\"` 或 `\'` | 只转外层包裹用的那种 |
| `\n` /`\r` /`\t` | `\n` /`\r` /`\t` | 控制字符 |
| 非 ASCII（> 127） | `\uXXXX` | 仅 `escape_unicode = true` 时；UTF-16 编码（surrogate pair 一组两个 `\u` ） |

### 7.3 unescape 核心（~15 行）

```
fn unescape(s: &str) -> Result<String, JsonitaError> {
    let mut out = String::with_capacity(s.len());
    let mut chars = s.chars();
    while let Some(c) = chars.next() {
        if c != '\\' { out.push(c); continue; }
        match chars.next() {
            Some('"' | '\'' | '\\' | '/') => out.push(chars.clone().next().unwrap()), // 简化版
            Some('n') => out.push('\n'),
            Some('t') => out.push('\t'),
            Some('r') => out.push('\r'),
            Some('u') => {
                let hex: String = chars.by_ref().take(4).collect();
                let code = u32::from_str_radix(&hex, 16)
                    .map_err(|_| JsonitaError::Parse { line:0, col:0, msg: format!("invalid \\u{}", hex) })?;
                if let Some(c) = char::from_u32(code) { out.push(c); }
            }
            None => return Err(JsonitaError::Parse { line:0, col:0, msg: "trailing backslash".into() }),
            _ => {}
        }
    }
    Ok(out)
}
```

### 7.4 4 层嵌套转义验证

[plan/01 F3.2](../plan/01_features.md) 要求"支持 4 层嵌套转义"。基线 test case 在 `fixtures/nested_escape_4_levels.txt` ── 从 `{"a":1}` 起，逐层 stringify 4 次得到 L0；反向 unescape 4 次必须回到 `{"a":1}`。 `tests/stringify_tests.rs` 覆盖。

## 8 format 与 unwrap 的组合

[plan/01 F7.5](../plan/01_features.md) ── 设置 `auto_unwrap = true` 时， `json_format` command 内部先调 unwrap 再 format。这种"组合"逻辑放在 command 层， engine 模块依然纯：

```
// src-tauri/src/cmds/json_ops.rs（command 层，非 engine）
#[tauri::command]
pub async fn json_format(
    text: String,
    opts: FormatOpts,
    settings: tauri::State<'_, SettingsStore>,
) -> Result<String, JsonitaError> {
    let s = settings.get();
    let processed = if s.auto_unwrap {
        engine::unwrap::unwrap(&text, UnwrapOpts {
            timeout_ms: s.unwrap_timeout_ms,
            max_depth:  None,
        })?
    } else { text };

    // engine::json::format 同步 + CPU 密集 → 放进 blocking 池
    tauri::async_runtime::spawn_blocking(move || engine::json::format(&processed, opts))
        .await
        .map_err(|e| JsonitaError::Io(e.to_string()))?
}
```

三 · 契约速查

## 9 函数签名

所有签名 `fn(text: &str, opts) -> Result<String, JsonitaError>`。opts 字段定义见 [13 § 3.1](13_schemas.md)。

| 函数 | opts schema | 错误分支 |
| --- | --- | --- |
| `engine::json::format(text, opts)` | [FormatOpts](13_schemas.md) | Parse / Io |
| `engine::json::minify(text)` | — | Parse / Io |
| `engine::unwrap::unwrap(text, opts)` | [UnwrapOpts](13_schemas.md) | Parse / UnwrapTimeout / Io |
| `engine::stringify::json_to_string(text, opts)` | [StringifyOpts](13_schemas.md) | Parse / Io |
| `engine::stringify::string_to_json(text)` | — | Parse / Io |

四 · 运行时数字

## 10 性能基线

| 输入 | format P50 | format P95 | minify P50 | unwrap P50（5 层嵌套） |
| --- | --- | --- | --- | --- |
| 10 KB | 3 ms | 8 ms | 2 ms | 6 ms |
| 100 KB | 22 ms | 45 ms | 14 ms | 55 ms |
| 1 MB | 180 ms | 320 ms | 110 ms | —（不保证） |

测量条件：M1 Pro · release build · serde_json 1.0.x · preserve_order feature。Bench 实现走 criterion，源码 `src-tauri/benches/json_bench.rs`。
