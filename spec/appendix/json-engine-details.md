# 附录：JSON Engine 明细

核心语义见 [06_json_engine.md](../06_json_engine.md)。本页只列签名、伪代码和测试边界。

## 函数签名

| 函数 | opts | 返回 | 错误 |
| --- | --- | --- | --- |
| `engine::json::format(text, opts)` | `FormatOpts` | `String` | Parse / Io |
| `engine::json::minify(text)` | none | `String` | Parse / Io |
| `engine::unwrap::unwrap(text, opts)` | `UnwrapOpts` | `String` | Parse / UnwrapTimeout / Io |
| `engine::stringify::json_to_string(text, opts)` | `StringifyOpts` | `String` | Parse / Io |
| `engine::stringify::string_to_json(text)` | none | `String` | Parse / Io |

## 模块文件

| 文件 | 内容 |
| --- | --- |
| `src-tauri/src/engine/json.rs` | format / minify / sort_keys。 |
| `src-tauri/src/engine/unwrap.rs` | recursive stringified JSON unwrap。 |
| `src-tauri/src/engine/stringify.rs` | JSON 与 string literal 互转。 |
| `src-tauri/src/engine/error_loc.rs` | serde_json error 到 `JsonitaError::Parse`。 |
| `src-tauri/src/engine/tests/` | 无 Tauri runtime 的单测。 |

## sort_keys 伪代码

```
fn sort_keys_recursive(v: &mut Value) {
    match v {
        Value::Object(map) => {
            let mut keys = map.keys().cloned().collect::<Vec<_>>();
            keys.sort();
            let mut sorted = serde_json::Map::new();
            for key in keys {
                let mut child = map.remove(&key).unwrap();
                sort_keys_recursive(&mut child);
                sorted.insert(key, child);
            }
            *map = sorted;
        }
        Value::Array(items) => items.iter_mut().for_each(sort_keys_recursive),
        _ => {}
    }
}
```

## unwrap 判断表

| 输入 string parse 结果 | 行为 |
| --- | --- |
| object | 替换为 object 并继续递归。 |
| array | 替换为 array 并继续递归。 |
| number / bool / null | 保留原 string。 |
| parse 失败 | 保留原 string。 |
| deadline reached | 返回 `UnwrapTimeout`。 |
| `depth > maxDepth` | 停止深入，保留当前值。 |

## error location

| serde_json 信息 | 输出字段 |
| --- | --- |
| `e.line()` | `Parse.line`，1-indexed。 |
| `e.column()` | `Parse.col`，1-indexed。 |
| `e.to_string()` | 去掉 ` at line ...` 后作为 `Parse.msg`。 |

## Fixture / 性能基线

| 场景 | 期望 |
| --- | --- |
| 100KB JSON format | p95 50ms 以内。 |
| 4 层 stringified JSON | unwrap 后回到合法 object/array。 |
| trailing comma | Parse，保留 line/col。 |
| key without double quote | Parse，提示 key must be string。 |
| 大对象 sort_keys | 保持合法 JSON，递归排序 object key。 |
| timeout fixture | `UnwrapTimeout`，不返回部分成功。 |
