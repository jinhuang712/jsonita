# Platform Specs

`platform/` 放支撑核心体验但不该打断主阅读路径的工程契约。这里的文档仍然定义行为边界和失败收场；字段长表、命令全文、配置变量和测试矩阵继续放到 [../appendix/](../appendix/README.md)。

## I · Integration Contract

| 文档 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| [I00-ai-provider-protocol.md](I00-ai-provider-protocol.md) | DeepSeek 接入边界、最小外发、上游失败如何映射回 AI Repair。 | 不保存完整 prompt 和 wire 明细；明细见 [../appendix/A05-ai-protocol-details.md](../appendix/A05-ai-protocol-details.md)。 |
| [I01-ipc-api.md](I01-ipc-api.md) | Tauri command/event 的跨边界 API 表、命名约定和错误分支。 | 不重新定义 WebView/Rust 主权；主权边界见 [../S02-ipc-boundary.md](../S02-ipc-boundary.md)。 |

## R · Reliability / Runtime Operations

| 文档 | 负责什么 | 不负责什么 |
| --- | --- | --- |
| [R00-release-readiness.md](R00-release-readiness.md) | release 前版本、构建产物、签名、公证、验证和失败收场门禁。 | 不列完整 Tauri config 和命令变量；明细见 [../appendix/A04-packaging-details.md](../appendix/A04-packaging-details.md)。 |

## 何时新增平台文档

新增 `Ixx` 或 `Rxx` 时必须同时更新：

| 位置 | 更新内容 |
| --- | --- |
| [../README.md](../README.md) | Spec 快速决策地图和 I/R 表。 |
| [../../PROJECT.md](../../PROJECT.md) | 项目级文档导航。 |
| [../../CHANGELIST.md](../../CHANGELIST.md) | 跨文档变更记录。 |
| [../appendix/README.md](../appendix/README.md) | 如果新增或移动了实现明细。 |
