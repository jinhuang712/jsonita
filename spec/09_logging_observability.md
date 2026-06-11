# 日志与可观测性

Jsonita 的日志用于本地诊断和 support，不是远程 telemetry。它应该帮助开发者定位生命周期、命令、存储、AI、窗口、设置等问题，同时严格避免记录用户 JSON 和 API key。

## 读完这篇你应该知道

- 哪些事件值得记录。
- 日志为什么必须本地、滚动、可导出。
- 前端日志如何进入 Rust writer。
- 日志失败不能影响哪些主流程。

## 日志边界

日志记录的是系统行为，不是用户数据。允许记录 command 名、耗时、成功/失败、错误 kind、状态码、文件路径类别、窗口尺寸来源、settings key 名称等；不允许记录 JSON 文档全文、API key、DeepSeek prompt 中的用户文本、剪贴板全文。

日志文件保存在本地，按大小或时间滚动。用户可以打开日志目录或导出日志用于 support。

## 事件分类

| 分类 | 例子 | 目的 |
| --- | --- | --- |
| lifecycle | app_start、window_show、window_hide、app_quit | 定位启动和窗口问题。 |
| command | command_start、command_success、command_error | 定位 IPC 和耗时。 |
| storage | db_migration、settings_write、secrets_write | 定位本地数据问题。 |
| ai | ai_request_start、ai_http_error、ai_invalid_json | 定位 AI 修复问题，不记录 prompt 文本。 |
| window | resize_auto、resize_user、theme_applied | 定位浮窗和主题问题。 |
| logging | log_open、log_export、log_write_error | 诊断 support workflow。 |

## 前端日志

WebView 可以通过 logging command 上报必要的前端事件，例如 UI 捕获到的异常、AI pane 状态、Diff 决策。Rust 仍是 durable writer，前端不能直接写文件。

前端上报前要先避免把 editor content 塞进 payload；Rust writer 仍要做二次脱敏。

## Support Flow

用户遇到问题时，可以从 About 或菜单项打开日志目录。导出日志只打包允许字段和本地日志文件，不附带 SQLite、settings、secrets 或 JSON 文档。

## 失败语义

日志写失败不应让 JSON 主流程崩溃。日志目录打开失败是 support action failure，要有反馈。脱敏失败时宁可丢字段，也不能写出敏感内容。

## 附录

- JSONL 字段、事件表、脱敏 allow/deny list 见 [appendix/logging-details.md](appendix/logging-details.md)。
- logging command 细节见 [appendix/ipc-api.md](appendix/ipc-api.md)。
