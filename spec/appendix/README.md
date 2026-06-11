# Spec 附录

附录只在需要精确明细时阅读。系统理解主线在上一层核心 spec。

| 附录 | 内容边界 |
| --- | --- |
| [A00-schemas.md](A00-schemas.md) | `JsonitaError`、enum、IPC payload、settings/window/secrets schema、类型同步规则。 |
| [A01-storage-details.md](A01-storage-details.md) | SQLite DDL、PRAGMA、迁移和本地文件路径。 |
| [A02-json-engine-details.md](A02-json-engine-details.md) | JSON engine 函数签名、核心算法伪代码、fixture/性能基线。 |
| [A03-logging-details.md](A03-logging-details.md) | JSONL 字段、事件 catalog、脱敏 allow/deny list。 |
| [A04-packaging-details.md](A04-packaging-details.md) | Tauri 配置摘要、capabilities、发布命令、签名/公证变量。 |
| [A05-ai-protocol-details.md](A05-ai-protocol-details.md) | Prompt 模板、DeepSeek wire 参数、响应抽取和 Diff props。 |
| [V00-validation-matrix.md](V00-validation-matrix.md) | 文档、前端、Tauri、release 的验证矩阵和残留检查。 |

跨边界接入和运行可靠性契约不放这里，见 [../platform/](../platform/README.md)。

如果某段内容是在解释系统如何工作，而不是列字段、签名、DDL、模板或命令，它应该回到对应核心 spec。
