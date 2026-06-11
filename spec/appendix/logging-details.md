# 附录：日志明细

核心语义见 [09_logging_observability.md](../09_logging_observability.md)。本页只列字段、事件和脱敏规则。

## JSONL 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts` | ISO string | 事件时间。 |
| `level` | `debug | info | warn | error` | 日志等级。 |
| `event` | string | 事件名。 |
| `requestId` | string? | command/AI request 关联。 |
| `durationMs` | number? | 耗时。 |
| `kind` | string? | `JsonitaError.kind`。 |
| `status` | number? | HTTP status。 |
| `source` | `rust | webview` | 来源。 |
| `fields` | object | 已脱敏扩展字段。 |

## Event catalog

| 分类 | events |
| --- | --- |
| lifecycle | `app_start`、`app_ready`、`window_show`、`window_hide`、`app_quit` |
| command | `command_start`、`command_success`、`command_error` |
| storage | `db_open`、`db_migrate`、`settings_write`、`secrets_write` |
| ai | `ai_request_start`、`ai_http_error`、`ai_invalid_json`、`ai_request_success` |
| window | `resize_auto`、`resize_user`、`theme_applied` |
| support | `log_open_dir`、`log_export`、`log_write_error` |

## Redaction deny list

| 禁止字段 | 说明 |
| --- | --- |
| `content` / `input` / `output` | 用户 JSON 文本。 |
| `apiKey` / `authorization` / `token` | secrets。 |
| `prompt` / `rawPrompt` | AI prompt 中可能包含用户 JSON。 |
| `clipboardText` | 剪贴板全文。 |
| `raw` | AI raw output 需要单独审查，默认不写日志。 |

## Allow list examples

| 字段 | 说明 |
| --- | --- |
| `command` | command 名。 |
| `opType` | 操作类型。 |
| `bytes` / `lineCount` | 尺寸指标。 |
| `retryAfterSec` | 限流信息。 |
| `settingsKey` | 设置项名称，不含值。 |
| `pathKind` | `db` / `logDir` / `appData` 等路径类别。 |

## Rolling policy

| 项 | 值 |
| --- | --- |
| 单文件上限 | 5 MB。 |
| 保留文件数 | 5。 |
| 格式 | JSONL。 |
| 导出 | 打包日志文件，不附带 DB/settings/secrets。 |
