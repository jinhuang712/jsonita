SPEC · 章节 13

# 数据模型参考

所有 Rust struct / enum / SQL DDL / TypeScript interface / 配置文件 schema 唯一权威。其他章节 不 重复定义，仅以接口签名 + link 引用。

REF

本章是 数据契约的单一来源。Rust ↔ TypeScript 双向镜像在此对齐；改 Rust struct 必须同步改本章 + 对应 TS 表。其他章节（02 IPC / 10 storage / 11 ai 等）只引用，不重复定义。

## 1 错误类型

### 1.1 JsonitaError（统一错误枚举）

Rust 端单一错误，所有内部错误统一映射；通过 serde 跨 IPC 序列化为 TS discriminated union。

| variant | payload | 触发场景 | 调用方信息（呈现见 design/02 § 5.1） |
| --- | --- | --- | --- |
| `Parse` | `{ line: u32, col: u32, msg: String }` | JSON 解析失败 | 精确错误位置与消息 |
| `UnwrapTimeout` | `{ ms: u64, depth: u32 }` | 嵌套 unwrap 超时 | 超时阈值与深度 |
| `Sqlite` | `String` | SQLite 错误 | 数据库错误摘要 |
| `Secrets` | `String` | secrets.json 存取错（读写 / chmod / 序列化失败） | secrets 操作错误摘要 |
| `Http` | `{ status: u16, body: String }` | DeepSeek HTTP 错 | HTTP status + body 摘要 |
| `AiInvalidJson` | `{ raw: String }` | AI 返回非合法 JSON | raw model output |
| `RateLimit` | `{ retry_after_sec: u64 }` （IPC 为 `retryAfterSec` ） | 上游 429 | retry-after 秒数 |
| `Io` | `String` | FS / 网络 / 其他 | 操作错误摘要 |
| `AiDisabled` | — | settings.ai_enabled=false 时调 ai_fix | 无额外 payload |

```
// src-tauri/src/error.rs ── 唯一定义点
#[derive(Debug, thiserror::Error, serde::Serialize)]
#[serde(tag = "kind", content = "data")]
pub enum JsonitaError {
    #[error("JSON parse error at line {line}, col {col}: {msg}")]
    Parse { line: u32, col: u32, msg: String },

    #[error("Unwrap timeout after {ms}ms (depth {depth})")]
    UnwrapTimeout { ms: u64, depth: u32 },

    #[error("SQLite: {0}")]  Sqlite(String),
    #[error("Secrets: {0}")] Secrets(String),
    #[error("HTTP {status}: {body}")] Http { status: u16, body: String },
    #[error("AI invalid JSON: {raw}")] AiInvalidJson { raw: String },
    #[error("Rate limited; retry after {retry_after_sec}s")]
    #[serde(rename_all = "camelCase")]
    RateLimit { retry_after_sec: u64 },
    #[error("IO: {0}")] Io(String),
    #[error("AI Fix is disabled in Settings")] AiDisabled,
}
```

TS 镜像 （ `src/types/error.ts` ）：

```
export type JsonitaError =
  | { kind: 'Parse';          data: { line: number; col: number; msg: string } }
  | { kind: 'UnwrapTimeout';  data: { ms: number; depth: number } }
  | { kind: 'Sqlite';         data: string }
  | { kind: 'Secrets';        data: string }
  | { kind: 'Http';           data: { status: number; body: string } }
  | { kind: 'AiInvalidJson';  data: { raw: string } }
  | { kind: 'RateLimit';      data: { retryAfterSec: number } }
  | { kind: 'Io';             data: string }
  | { kind: 'AiDisabled' };
```

## 2 枚举集合

所有 enum 都用 `#[serde(rename_all = "kebab-case")]` 序列化。

| 枚举 | 变体 | 用途 |
| --- | --- | --- |
| `IndentMode` | `spaces2` /`spaces4` /`tab` | F1 Formatter 缩进选项 |
| `QuoteStyle` | `double` /`single` | F3 String 互转 quote 风格 |
| `OpType` | `format` /`minify` /`tree` /`str-to-json` /`json-to-str` /`ai-fix` | 历史记录 op_type 字段 |
| `ThemeMode` | `system` /`light` /`dark` | 主题设置项 |
| `RestoreWindow` | `off` /`min-1` /`min-5` /`min-15` /`hour-1` | 保留设置字段；当前版本不驱动自动恢复 UI |
| `ShortcutAction` | `toggle-window` /`restore-last` | F6 可注册全局快捷键 |
| `InitialWidth` | `w-720` /`w-860` /`w-920` /`w-1080` | 保留设置字段；当前窗口默认固定 860 px，未消费此枚举 |

```
// src-tauri/src/types.rs
#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum IndentMode    { Spaces2, Spaces4, Tab }

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum QuoteStyle    { Double, Single }

#[derive(Serialize, Deserialize, Clone, Copy, PartialEq)]
#[serde(rename_all = "kebab-case")]
pub enum OpType        { Format, Minify, Tree, StrToJson, JsonToStr, AiFix }

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ThemeMode     { System, Light, Dark }

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum RestoreWindow { Off, Min1, Min5, Min15, Hour1 }

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum ShortcutAction { ToggleWindow, RestoreLast }

#[derive(Serialize, Deserialize, Clone, Copy)]
#[serde(rename_all = "kebab-case")]
pub enum InitialWidth  { W720, W860, W920, W1080 }

// ShortcutAction 目前后端 command 使用 String 解析；此 enum 作为 schema 约束保留。
```

## 3 IPC payload structs

所有 IPC struct 都用 `#[serde(rename_all = "camelCase")]` ── Rust snake_case 字段 ↔ TS camelCase。

### 3.1 json_ops 选项

| struct · 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| FormatOpts |  |  |  |
| · indent | IndentMode | Spaces2 | 缩进档 |
| · sortKeys | bool | false | 递归字典序 sort |
| · trailingNewline | bool | true | 末尾加 \n |
| UnwrapOpts |  |  |  |
| · timeoutMs | u64 | 200 | 超时保护 |
| · maxDepth | `Option<u32>` | None | 无层数限制（默认） |
| StringifyOpts |  |  |  |
| · quote | QuoteStyle | Double | 包裹引号 |
| · escapeUnicode | bool | false | \\uXXXX 转义 |
| · minify | bool | true | 转 string 时是否先压缩 |

### 3.2 历史 / 会话

| struct · 字段 | 类型 | 说明 |
| --- | --- | --- |
| HistoryRow | SQLite history 表行（同 § 4.1） |  |
| · id | i64 | PK |
| · createdAt | i64 | unix ms |
| · content | String | 完整 JSON 文本 |
| · summary | String | 前 80 字符 |
| · contentHash | String | sha256 hex（去重） |
| · opType | OpType |  |
| · pinned | bool |  |
| · starred | bool |  |
| ListOpts |  |  |
| · limit | u32 | 默认 50 |
| · offset | u32 | 默认 0 |
| · onlyPinned | `Option<bool>` |  |
| · onlyStarred | `Option<bool>` |  |
| LastSession | last_session 单行（同 § 4.2） |  |
| · content | String |  |
| · opType | OpType |  |
| · savedAt | i64 | unix ms |

### 3.3 设置

所有可配置项的 权威字段表。新增设置项必须先改本表。

| 字段 | 类型 | 默认 | UI 位置 |
| --- | --- | --- | --- |
| · General |  |  |  |
| launchAtLogin | bool | true | F7.1（字段与 UI 已有；当前未接系统 Login Items） |
| showInMenubar | bool | true | 保留字段；当前 UI 未渲染，tray 始终创建 |
| autoPasteClipboard | bool | true | F7.1（字段与 UI 已有；当前未自动读剪贴板） |
| hideOnBlur | bool | true | F7.1 |
| singlePaneMode | bool | false | F7.1 |
| theme | ThemeMode | System | F7.1 |
| locale | Locale | EnUs | F7.1 (English / 简体中文) |
| restoreWindow | RestoreWindow | Min5 | F7.1（保留字段；当前不驱动自动恢复） |
| initialWidth | InitialWidth | W920 | 保留字段；当前窗口默认 860 px，Settings UI 未渲染 |
| smartWidth | bool | true | F7.1（plan F10） |
| · Shortcuts |  |  |  |
| shortcutToggle | String | "Cmd+Shift+J" | F7.2 |
| shortcutRestoreLast | String | "Cmd+Shift+L" | F7.2 |
| shortcutSplitToggle | String | "Cmd+\\" | 切换单窗 / 双栏（阶段 1 已实现；窗口内、可自定义；旧 settings.json 缺字段时默认补齐） |
| · AI |  |  |  |
| aiEnabled | bool | false | F7.3 |
| aiModelId | String | "deepseek-chat" | F7.3 |
| · History |  |  |  |
| historyLimit | u32 | 100 | F7.4 (10/50/100/200) |
| · JSON Transform |  |  |  |
| autoUnwrap | bool | true | F7.5 (F3.3) |
| unwrapTimeoutMs | u64 | 200 | F7.5 |
| · Editor（08 章） |  |  |  |
| editorSoftWrap | bool | true | F1 编辑器 |

Settings UI 暴露边界：当前 6 分组设置面板只展示 `locale`、 `theme`、 `launchAtLogin`、 `hideOnBlur`、 `smartWidth`、 `singlePaneMode`、 `autoPasteClipboard`、3 个 shortcut、 `aiEnabled`、 `historyLimit`、 `autoUnwrap`、 `unwrapTimeoutMs`、 `editorSoftWrap` 与 About 只读信息。 `showInMenubar`、 `restoreWindow`、 `initialWidth`、 `aiModelId` 是 schema / 运行时保留或内部字段，当前不作为可编辑设置暴露。

Locale enum：Rust 端使用 `Locale::EnUs` /`Locale::ZhCn`，序列化为 `"en-US"` /`"zh-CN"`；TS 镜像为 `'en-US' | 'zh-CN'`。文档中所有用户可见语言选项必须和这里保持一致。

### 3.4 AI Fix

| struct · 字段 | 类型 | 说明 |
| --- | --- | --- |
| AiFixReq |  |  |
| · text | String | 原文 |
| · errorLine / errorCol / errorMsg | Option<...> | parse 错误位置（hint） |
| · requestId | String | UUID v4，幂等去重 |
| AiFixResp |  |  |
| · fixed | String | 已验证为合法 JSON |
| · model | String | echoed from server |
| · tokensIn / tokensOut | u32 |  |
| · elapsedMs | u64 |  |
| TestConnectionResp |  |  |
| · ok | bool |  |
| · latencyMs | u64 |  |
| · modelEchoed | String | or error string |

### 3.5 窗口 / 系统

| struct · 字段 | 类型 | 说明 |
| --- | --- | --- |
| ClipboardSniff |  |  |
| · text | String |  |
| · looksLikeJson | bool | trim 后以 {[" 起结 |
| ContentMetrics （plan F10 智能缩放） |  |  |
| · maxLineChars | u32 | 最长结构行字符数；前端忽略行首缩进，避免按 `Tab` 触发窗口 resize |
| · lineCount | u32 |  |
| · bytes | u64 |  |
| · nonWhitespaceChars | u32 | 非空白字符数；极小 JSON 不触发自动缩小 |
| · softWrapOn | bool | true → 宽度保守，仍按高度 / 字号动态缩放 |
| · fontSize | f64 | 当前编辑器字号，参与宽高估算 |
| WindowResizedPayload （event） |  |  |
| · width / height | u32 |  |
| · source | "user" \| "auto" | 用户拖动 / 智能缩放触发 |
| ShortcutRegisterReq / Resp | 见 02 § 2.1.7 |  |

### 3.6 TreeView 复制（plan F2 · spec 08 § 4.5）

| struct · 字段 | 类型 | 说明 |
| --- | --- | --- |
| CopyNodeInfo （TS only · 前端事件） |  |  |
| · path | string | 'user.items[2]' |
| · isLeaf | boolean |  |
| · text | string | 已计算好的剪贴板字符串 |

## 4 SQLite schema

### 4.1 history 表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | INTEGER | PK AUTOINCREMENT | 主键 |
| created_at | INTEGER | NOT NULL | unix ms |
| content | TEXT | NOT NULL | 完整 JSON 文本 |
| summary | TEXT | NOT NULL | 前 80 字符 |
| content_hash | TEXT | NOT NULL · UNIQUE | sha256 hex |
| op_type | TEXT | CHECK in OpType 值集 |  |
| pinned | INTEGER | 0/1 default 0 |  |
| starred | INTEGER | 0/1 default 0 |  |
| tags | TEXT | NULL | 预留 JSON array |

索引：

| 索引 | 字段 | 用途 |
| --- | --- | --- |
| idx_history_hash | content_hash UNIQUE | 去重 UPSERT |
| idx_history_pinned_created | pinned DESC, created_at DESC | list 默认排序 |
| idx_history_starred | starred | 筛选 Starred |
| history_fts (FTS5) | content + summary | 全文搜索 |

### 4.2 last_session 表

| 字段 | 类型 | 约束 | 说明 |
| --- | --- | --- | --- |
| id | INTEGER | PK · CHECK (id = 1) | 强制单行 |
| content | TEXT | NOT NULL |  |
| op_type | TEXT | NOT NULL |  |
| saved_at | INTEGER | NOT NULL | unix ms |

### 4.3 app_meta 表

| 字段 | 类型 |
| --- | --- |
| key | TEXT PRIMARY KEY |
| value | TEXT NOT NULL |

当前已建表但未写入业务数据；用途保留给 `install_at` 等未来元数据。迁移版本权威在独立 `schema_version` 表。

### 4.4 schema_version 迁移表

| 字段 | 类型 |
| --- | --- |
| v | INTEGER NOT NULL |

### 4.5 PRAGMA

| pragma | 值 | 原因 |
| --- | --- | --- |
| journal_mode | WAL | 读 / 写并发 |
| synchronous | NORMAL | WAL 下安全 + 快 |
| foreign_keys | ON | 预防未来表关系 |
| busy_timeout | 5000 | 避免 lock 失败 |

## 5 配置文件（JSON Store）

### 5.1 settings.json

由 § 3.3 设置项字段表展开。文件路径 `~/Library/Application Support/Jsonita/settings.json`。

### 5.2 window.json

| key | 类型 | 说明 |
| --- | --- | --- |
| width / height | u32 | 用户拖动 / 智能缩放后的尺寸；读取时会自愈旧版自动缩放写出的过小尺寸 |
| userDragged | bool | 记录用户曾手动拖边，用于恢复上次尺寸； `true` 时智能缩放 no-op， `false` 的过小自动尺寸会恢复默认值 |

### 5.3 assets/icons/manifest.json

见 [05 § 1](../design/05_icons_theme.md)；权威字段： `masters` ·`palette` ·`pngSizes` ·`macOS` ·`windows` ·`menubar`。

## 6 secrets.json schema

路径： `~/Library/Application Support/Jsonita/secrets.json`，权限 `chmod 600`。结构是 扁平 map：account → plain string。

| key | value 类型 | 状态 |
| --- | --- | --- |
| `deepseek_api_key` | string · DeepSeek API key（ `sk-*` ） | v1 唯一项 |
| `openai_api_key` | — | v2 预留 |

示例：

```
{
  "deepseek_api_key": "sk-xxxxxxxxxxxxxxxx"
}
```

封装实现见 [10 § 6](10_storage.md)。此文件只保存 API key，不进入 settings、日志或事件 payload。

## 7 命名规范汇总

Rust struct 字段 ：snake_case

Rust enum variant ：CamelCase，序列化时 kebab-case（统一加 `#[serde(rename_all = "kebab-case")]` ）

TS interface 字段 ：camelCase（由 Rust struct 的 `#[serde(rename_all = "camelCase")]` 自动转换）

SQL 字段 ：snake_case

Tauri command 名 ：snake_case（ `json_format` ）

Tauri event 名 ：冒号分隔的 namespace:name（如 `settings:changed` ）

OpType 字符串 ：kebab-case，与 enum 序列化一致（ `"ai-fix"` 不是 `"ai_fix"` ）

## 8 类型同步流程（Rust ↔ TS）

改 Rust struct/enum → 立刻改本章对应字段表

改本章 → 同步 `src/types/*.ts` 镜像

PR 模板复选框： `[ ] 13 § N updated` + `[ ] src/types updated`

CI smoke test：调每个 command 一次 + listen 每个 event，验 (de)serialize 双向

## 9 各章节引用入口

| 章节 | 引用本章哪节 |
| --- | --- |
| 02 IPC 合约 | § 1 · § 3.1-3.5（命令签名 + payload） |
| 03 设计令牌 | § 3.3 settings.theme / initialWidth / editorSoftWrap |
| 04 组件库映射 | § 3.6 CopyNodeInfo |
| 06 窗口 runtime | § 3.5 ContentMetrics / WindowResizedPayload · § 5.2 window.json |
| 08 编辑器 | § 3.6 CopyNodeInfo · § 3.3 editorSoftWrap |
| 09 JSON 引擎 | § 3.1 FormatOpts / UnwrapOpts / StringifyOpts · § 1 Parse / UnwrapTimeout |
| 10 存储 & 会话 | § 4 SQLite 表 · § 3.2 HistoryRow / LastSession · § 6 secrets.json |
| 11 AI 客户端 | § 3.4 AiFixReq / AiFixResp |
