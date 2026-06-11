# Spec 附录

附录只在需要精确明细时阅读。系统理解主线在上一层核心 spec。

| 附录 | 内容边界 |
| --- | --- |
| [schemas.md](schemas.md) | `JsonitaError`、enum、IPC payload、settings/window/secrets schema、类型同步规则。 |
| [ipc-api.md](ipc-api.md) | command/event 列表、参数、返回值、主要错误分支。 |
| [json-engine-details.md](json-engine-details.md) | JSON engine 函数签名、核心算法伪代码、fixture/性能基线。 |
| [storage-details.md](storage-details.md) | SQLite DDL、PRAGMA、迁移和本地文件路径。 |
| [ai-protocol.md](ai-protocol.md) | prompt 模板、DeepSeek 请求默认值、响应抽取规则、Diff props。 |
| [logging-details.md](logging-details.md) | JSONL 字段、事件 catalog、脱敏 allow/deny list。 |
| [packaging-details.md](packaging-details.md) | Tauri 配置摘要、capabilities、发布命令、签名/公证变量。 |

如果某段内容是在解释系统如何工作，而不是列字段、签名、DDL、模板或命令，它应该回到对应核心 spec。
