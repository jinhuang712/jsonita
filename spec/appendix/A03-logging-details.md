# 附录：日志明细

核心语义见 [S06-logging-observability.md](../S06-logging-observability.md)。本页只列字段、事件和脱敏规则。

## JSONL 字段

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `ts` | ISO string | 事件时间。 |
| `level` | `INFO` / `WARN` / `ERROR` | 日志等级；文件里统一使用大写，debug 只允许本地开发 console，不进入 durable JSONL。 |
| `event` | string | 事件名。 |
| `requestId` | string? | command/AI request 关联。 |
| `durationMs` | number? | 耗时。 |
| `kind` | string? | `JsonitaError.kind`。 |
| `status` | number? | HTTP status。 |
| `source` | `rust` / `webview` | 来源。 |
| `fields` | object | 已脱敏扩展字段。 |

## Event catalog

| 分类 | events |
| --- | --- |
| lifecycle | `app.start`、`app.ready`、`window.show`、`window.hide`、`app.quit` |
| command | `command.start`、`command.success`、`command.error` |
| storage | `db.open`、`db.migration`、`settings.write`、`secrets.write` |
| ai | `ai.request_start`、`ai.http_error`、`ai.invalid_json`、`ai.request_success` |
| window | `resize.auto`、`resize.user`、`theme.applied` |
| support | `log.open`、`log.export`、`log.write_error` |

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
| 滚动方式 | 按天滚动。 |
| 保留窗口 | 7 天。 |
| 文件权限 | 当前用户可读写；Unix 下通过 `0600` 收敛。 |
| 格式 | JSONL。 |
| 导出 | 打包日志文件，不附带 DB/settings/secrets。 |
