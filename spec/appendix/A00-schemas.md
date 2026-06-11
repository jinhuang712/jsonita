# 附录：Schema 与类型明细

核心语义见 [S03-error-model.md](../S03-error-model.md)、[S05-storage-session.md](../S05-storage-session.md) 和 [S02-ipc-boundary.md](../S02-ipc-boundary.md)。本页只列完整字段。

## JsonitaError

| variant | payload | 场景 |
| --- | --- | --- |
| `Parse` | `{ line: u32, col: u32, msg: String }` | JSON parse 失败。 |
| `UnwrapTimeout` | `{ ms: u64, depth: u32 }` | 嵌套 unwrap 超时。 |
| `Sqlite` | `String` | SQLite 读写、迁移、查询失败。 |
| `Secrets` | `String` | `secrets.json` 读写、权限、序列化失败。 |
| `Http` | `{ status: u16, body: String }` | DeepSeek HTTP 或网络失败。 |
| `AiInvalidJson` | `{ raw: String }` | AI 返回无法通过 JSON 校验。 |
| `RateLimit` | `{ retry_after_sec: u64 }` | 上游 429；IPC 为 `retryAfterSec`。 |
| `Io` | `String` | 文件或其他 IO 错误。 |
| `AiDisabled` | none | AI 关闭时调用 AI command。 |

## 基础枚举

所有 enum 序列化使用 kebab-case。

| 枚举 | 变体 | 用途 |
| --- | --- | --- |
| `IndentMode` | `spaces2` / `spaces4` / `tab` | Format 缩进。 |
| `QuoteStyle` | `double` / `single` | JSON/string 互转 quote 风格。 |
| `OpType` | `format` / `minify` / `tree` / `str-to-json` / `json-to-str` / `ai-fix` | history op_type。 |
| `ThemeMode` | `system` / `light` / `dark` | 主题设置。 |
| `RestoreWindow` | `off` / `min-1` / `min-5` / `min-15` / `hour-1` | 保留字段；当前不驱动自动恢复。 |
| `ShortcutAction` | `toggle-window` / `restore-last` | 全局快捷键动作。 |
| `InitialWidth` | `w-720` / `w-860` / `w-920` / `w-1080` | 保留字段；当前 UI 未消费。 |

## JSON 操作 payload

| struct | 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `FormatOpts` | `indent` | `IndentMode` | `spaces2` | 输出缩进。 |
| `FormatOpts` | `sortKeys` | `bool` | `false` | 是否递归排序 object key。 |
| `FormatOpts` | `trailingNewline` | `bool` | `true` | 末尾是否加换行。 |
| `UnwrapOpts` | `timeoutMs` | `u64` | `200` | 超时保护。 |
| `UnwrapOpts` | `maxDepth` | `Option<u32>` | `None` | 最大递归层数。 |
| `StringifyOpts` | `quote` | `QuoteStyle` | `double` | 包裹引号。 |
| `StringifyOpts` | `escapeUnicode` | `bool` | `false` | 是否输出 `\uXXXX`。 |
| `StringifyOpts` | `minify` | `bool` | `true` | 转字符串前是否压缩 JSON。 |

## History / Session payload

| struct | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| `HistoryRow` | `id` | `i64` | PK。 |
| `HistoryRow` | `createdAt` | `i64` | Unix ms。 |
| `HistoryRow` | `content` | `String` | 完整 JSON 文本。 |
| `HistoryRow` | `summary` | `String` | 前 80 字符摘要。 |
| `HistoryRow` | `contentHash` | `String` | sha256 hex。 |
| `HistoryRow` | `opType` | `OpType` | 操作类型。 |
| `HistoryRow` | `pinned` / `starred` | `bool` | 收藏状态。 |
| `ListOpts` | `limit` / `offset` | `u32` | 分页参数；默认 `50` / `0`。 |
| `ListOpts` | `onlyPinned` / `onlyStarred` | `Option<bool>` | 筛选。 |
| `LastSession` | `content` | `String` | 恢复文本。 |
| `LastSession` | `opType` | `OpType` | 最后操作。 |
| `LastSession` | `savedAt` | `i64` | Unix ms。 |

## Settings schema

| 字段 | 类型 | 默认 | UI |
| --- | --- | --- | --- |
| `launchAtLogin` | `bool` | `true` | General；字段已有，系统 Login Items 未接。 |
| `showInMenubar` | `bool` | `true` | 保留；tray 始终创建。 |
| `autoPasteClipboard` | `bool` | `true` | General；当前未自动读剪贴板。 |
| `hideOnBlur` | `bool` | `true` | General。 |
| `singlePaneMode` | `bool` | `false` | General。 |
| `theme` | `ThemeMode` | `system` | General。 |
| `locale` | `'en-US'` / `'zh-CN'` | auto | General；v1 UI 只开放英文。 |
| `restoreWindow` | `RestoreWindow` | `min-5` | 保留；当前不自动恢复。 |
| `initialWidth` | `InitialWidth` | `w-920` | 保留；当前默认 860 px。 |
| `smartWidth` | `bool` | `true` | General。 |
| `shortcutToggle` | `String` | `Cmd+Shift+J` | Shortcuts。 |
| `shortcutRestoreLast` | `String` | `Cmd+Shift+L` | Shortcuts。 |
| `shortcutSplitToggle` | `String` | `Cmd+\` | Shortcuts；切单窗/双栏。 |
| `aiEnabled` | `bool` | `false` | AI。 |
| `aiModelId` | `String` | `deepseek-chat` | AI；内部字段。 |
| `historyLimit` | `u32` | `100` | History。 |
| `autoUnwrap` | `bool` | `true` | JSON Transform。 |
| `unwrapTimeoutMs` | `u64` | `200` | JSON Transform。 |
| `editorSoftWrap` | `bool` | `true` | Editor。 |

## Window / system payload

| struct | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| `ClipboardSniff` | `text` | `String` | 剪贴板文本。 |
| `ClipboardSniff` | `looksLikeJson` | `bool` | trim 后像 JSON。 |
| `ContentMetrics` | `maxLineChars` | `u32` | 最长结构行字符数。 |
| `ContentMetrics` | `lineCount` | `u32` | 行数。 |
| `ContentMetrics` | `bytes` | `u64` | 字节数。 |
| `ContentMetrics` | `nonWhitespaceChars` | `u32` | 非空白字符数。 |
| `ContentMetrics` | `softWrapOn` | `bool` | soft-wrap 状态。 |
| `ContentMetrics` | `fontSize` | `f64` | 当前编辑器字号。 |
| `WindowResizedPayload` | `width` / `height` | `u32` | 窗口尺寸。 |
| `WindowResizedPayload` | `source` | `user` / `auto` | 用户拖动或自动缩放。 |

## AI payload

| struct | 字段 | 类型 | 说明 |
| --- | --- | --- | --- |
| `AiFixReq` | `text` | `String` | 当前 editor 文本。 |
| `AiFixReq` | `errorLine` / `errorCol` / `errorMsg` | `Option` | parse hint。 |
| `AiFixReq` | `requestId` | `String` | UUID v4。 |
| `AiFixResp` | `fixed` | `String` | 已验证合法 JSON。 |
| `AiFixResp` | `model` | `String` | 上游模型。 |
| `AiFixResp` | `tokensIn` / `tokensOut` | `u32` | token 计数。 |
| `AiFixResp` | `elapsedMs` | `u64` | 耗时。 |
| `TestConnectionResp` | `ok` | `bool` | 是否成功。 |
| `TestConnectionResp` | `latencyMs` | `u64` | 延迟。 |
| `TestConnectionResp` | `modelEchoed` | `String` | 模型或错误摘要。 |

## 本地文件 schema

| 文件 | 字段 |
| --- | --- |
| `settings.json` | settings schema 全量字段。 |
| `window.json` | `width`、`height`、`userDragged`。 |
| `secrets.json` | `accounts.deepseek_api_key.value`、`createdAt`、`updatedAt`。 |

## 类型同步规则

1. Rust struct/enum 变更时，同步 TypeScript mirror。
2. IPC 字段跨边界时使用 camelCase。
3. enum 序列化值进入 UI/存储前必须在本页登记。
4. PR 检查项：owner appendix updated + `src/types` updated。
