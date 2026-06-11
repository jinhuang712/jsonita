# Spec 阅读入口

Jsonita 的 spec 已按 WORKFLOW 编号落地：`S` 写系统契约，`M` 写用户可触发能力，`I/R` 写平台支撑契约，`A/V` 写实现明细和验证细节。每篇核心文档都从自己的问题出发：架构文档讲系统地图，生命周期讲状态机，前端文档讲用户操作如何变成状态，IPC 文档讲边界契约，错误文档讲一次失败如何被分诊和恢复。

如果你是 coding agent，默认先读 `S/M` 核心 spec；改跨边界接入或发布可靠性时再读 [platform/](platform/README.md)；只有在需要完整字段表、SQL、命令签名、prompt 模板、release 命令或测试矩阵时，才进入 [appendix/](appendix/README.md)。

## 快速决策地图

```mermaid
flowchart TD
  Start["我要改 Jsonita"] --> Kind{"改什么？"}
  Kind -->|"系统边界或模块协作"| S00["S00 系统架构"]
  Kind -->|"启动、隐藏、快捷键、退出"| S01["S01 运行时生命周期"]
  Kind -->|"Editor、Pane、Tree、Diff、快捷键、搜索"| M00["M00 前端执行"]
  Kind -->|"invoke、event、TS/Rust payload"| S02["S02 IPC 边界"]
  Kind -->|"错误分类、恢复、用户提示"| S03["S03 错误模型"]
  Kind -->|"隐私、secrets、外发、权限"| S04["S04 安全与隐私"]
  Kind -->|"format、minify、unwrap、string 转换"| M01["M01 JSON Engine"]
  Kind -->|"SQLite、settings、session、history"| S05["S05 存储与会话"]
  Kind -->|"AI Fix、prompt、Diff 接受"| M02["M02 AI Repair"]
  Kind -->|"日志、support、脱敏"| S06["S06 日志与可观测性"]
  Kind -->|"版本、DMG、release、签名"| S07["S07 打包与分发"]
  S02 --> I01["I01 IPC API"]
  M02 --> I00["I00 AI Provider Protocol"]
  S07 --> R00["R00 Release Readiness"]
  S02 --> Appendix["需要完整字段时再读 A/V"]
  S05 --> Appendix
  M02 --> Appendix
  R00 --> Appendix
```

## S · 系统契约

| 文档 | 这篇文档解决的问题 | 推荐读者 |
| --- | --- | --- |
| [S00-system-architecture.md](S00-system-architecture.md) | Jsonita 为什么分成 WebView、IPC、Rust domain、本地数据四个世界，以及一次操作如何穿过这些边界。 | 第一次进入仓库的人、跨模块改动者。 |
| [S01-runtime-lifecycle.md](S01-runtime-lifecycle.md) | 一个菜单栏 App 怎么做到常驻、隐藏、快速呼出、明确退出。 | 改窗口、tray、快捷键、NSPanel 行为的人。 |
| [S02-ipc-boundary.md](S02-ipc-boundary.md) | 前端为什么不能直接碰文件、网络和系统能力；command/event 如何承载跨边界协作。 | 改 command、payload、event、TS mirror 的人。 |
| [S03-error-model.md](S03-error-model.md) | “失败语义”到底是什么：失败后谁还能继续、谁要停止、用户看到什么、数据是否改变。 | 改错误、文案映射、重试、恢复流程的人。 |
| [S04-security-privacy.md](S04-security-privacy.md) | 用户 JSON、API key、日志、AI 请求什么时候留在本地，什么时候允许出境。 | 改 secrets、AI、日志、权限、外发的人。 |
| [S05-storage-session.md](S05-storage-session.md) | history、last_session、settings、window、secrets 为什么不能混在一起。 | 改 SQLite、settings、恢复、数据迁移的人。 |
| [S06-logging-observability.md](S06-logging-observability.md) | 本地日志如何帮 support，同时不泄漏 JSON 和 key。 | 改 logging、redaction、support action 的人。 |
| [S07-packaging-distribution.md](S07-packaging-distribution.md) | 什么样的 commit 可以变成 release，版本、产物、签名、公证如何卡住发布。 | 做 release、打包、版本升级的人。 |

## M · 用户能力

| 文档 | 这篇文档解决的问题 | 推荐读者 |
| --- | --- | --- |
| [M00-frontend-execution.md](M00-frontend-execution.md) | 用户在浮窗里输入、切 pane、搜索、看 Tree、接受 AI Diff 时，前端状态如何保护原文。 | 改 React、editor、Tree、search、AI pane、快捷键的人。 |
| [M01-json-engine.md](M01-json-engine.md) | 纯 JSON 变换如何保持可测试、可恢复、无 UI 副作用。 | 改 Rust engine、format/minify/string/unwrap 的人。 |
| [M02-ai-repair.md](M02-ai-repair.md) | AI Fix 从 parse error 到 Diff Accept 的完整审查链路。 | 改 DeepSeek、prompt、AI pane、Diff 的人。 |

## I/R · 平台支撑契约

`I/R` 仍然是行为契约，不是附录。它们只是不适合作为核心阅读第一站。

| 文档 | 类别 | 内容边界 |
| --- | --- | --- |
| [platform/I00-ai-provider-protocol.md](platform/I00-ai-provider-protocol.md) | Integration | DeepSeek 接入边界、最小外发、上游失败如何回到 AI Repair。 |
| [platform/I01-ipc-api.md](platform/I01-ipc-api.md) | Integration | Tauri command/event 的跨边界 API 表、命名约定和错误分支。 |
| [platform/R00-release-readiness.md](platform/R00-release-readiness.md) | Reliability | release 前版本、构建产物、签名、公证、验证和失败收场门禁。 |

## A/V · 附录明细

| 文档 | 类别 | 内容边界 |
| --- | --- | --- |
| [appendix/A00-schemas.md](appendix/A00-schemas.md) | Appendix | `JsonitaError`、enum、IPC payload、settings/window/secrets schema、类型同步规则。 |
| [appendix/A01-storage-details.md](appendix/A01-storage-details.md) | Appendix | SQLite DDL、PRAGMA、迁移和本地文件路径。 |
| [appendix/A02-json-engine-details.md](appendix/A02-json-engine-details.md) | Appendix | JSON engine 函数签名、核心算法伪代码、fixture/性能基线。 |
| [appendix/A03-logging-details.md](appendix/A03-logging-details.md) | Appendix | JSONL 字段、事件 catalog、脱敏 allow/deny list。 |
| [appendix/A04-packaging-details.md](appendix/A04-packaging-details.md) | Appendix | Tauri 配置摘要、capabilities、发布命令、签名/公证变量。 |
| [appendix/A05-ai-protocol-details.md](appendix/A05-ai-protocol-details.md) | Appendix | Prompt 模板、DeepSeek wire 参数、响应抽取和 Diff props。 |
| [appendix/V00-validation-matrix.md](appendix/V00-validation-matrix.md) | Verification | 文档、前端、Tauri、release 场景的验证矩阵和残留检查。 |

## 主权对象

| 主权对象 | 唯一定义位置 | 其他文档的使用方式 |
| --- | --- | --- |
| 系统分层、跨世界数据流 | [S00-system-architecture.md](S00-system-architecture.md) | 其他文档引用这个地图，不重新定义整体架构。 |
| App 运行状态机 | [S01-runtime-lifecycle.md](S01-runtime-lifecycle.md) | window、shortcut、tray、quit 行为以它为准。 |
| 前端可见状态与 input 覆盖规则 | [M00-frontend-execution.md](M00-frontend-execution.md) | pane、Tree、AI Diff、single-pane apply 不重复解释。 |
| IPC command/event 边界 | [S02-ipc-boundary.md](S02-ipc-boundary.md) | 完整签名在附录，行为边界只在这里定义。 |
| 失败分诊模型 | [S03-error-model.md](S03-error-model.md) | 各模块只说明本模块落到哪类失败，不重新发明错误分类。 |
| 本地优先和外发许可 | [S04-security-privacy.md](S04-security-privacy.md) | AI、logging、storage、packaging 都不能突破这条边界。 |
| JSON 变换语义 | [M01-json-engine.md](M01-json-engine.md) | UI/IPC/storage 只调用，不重写算法语义。 |
| 数据所有权 | [S05-storage-session.md](S05-storage-session.md) | SQLite、settings、window、secrets、last_session 只在这里定义主权。 |
| AI 修复审查链 | [M02-ai-repair.md](M02-ai-repair.md) | provider 接入见 I00，prompt 和 wire 明细可查附录，流程以这里为准。 |
| 日志脱敏边界 | [S06-logging-observability.md](S06-logging-observability.md) | 事件字段明细在附录，隐私边界以这里为准。 |
| 发布门禁 | [S07-packaging-distribution.md](S07-packaging-distribution.md) | release script 和配置块在附录，能否发布以这里为准。 |

## 平台与附录边界

`platform/` 和 `appendix/` 的区别是：platform 仍然定义行为边界，appendix 只展开机器级明细。

| 类型 | 应该回答 | 不应该承担 |
| --- | --- | --- |
| `Ixx` | 外部或跨边界系统如何接入，失败如何影响核心路径。 | 不完整重写 S/M 主流程。 |
| `Rxx` | 运行、恢复、发布、诊断的门禁如何触发和收场。 | 不堆命令输出和配置全文。 |
| `Axx` | 字段、DDL、prompt、命令、配置、变量完整长表。 | 不解释用户主路径和系统取舍。 |
| `Vxx` | 哪个场景跑什么验证，如何确认残留和回归。 | 不替代 CI，不把未决问题写成通过。 |

附录不是“第二套正文”。它只放读正文时不需要背下来的明细：

- 完整 schema、enum、payload 字段。
- 完整 IPC command/event 表。
- SQL DDL、PRAGMA、迁移细节。
- prompt 模板、DeepSeek wire protocol、默认参数。
- 日志字段表、redaction allow/deny list。
- release 命令、Tauri config、entitlements、签名变量。

如果一个字段、状态、事件或规则会直接影响系统行为，它必须先在核心 spec 中被点名；附录只负责展开完整字段和样例。

## Mermaid 使用规则

核心 spec 可以使用 Mermaid，但只使用 GitHub Markdown 稳定支持的保守子集：`flowchart TD`、`sequenceDiagram`、`stateDiagram-v2`。不要使用 ASCII diagram，不要在 Mermaid label 里放 Markdown 链接、HTML 或复杂代码片段。字段名、命令名、事件名放正文或表格里解释。

## 什么是“失败语义”

失败语义不是“这里会报错”。它必须回答四个问题：

| 问题 | 必须写清楚的内容 |
| --- | --- |
| 系统还继续吗？ | 继续编辑、可重试、需要用户动作、阻断发布、阻断启动。 |
| 用户看见什么？ | 状态栏、lint、modal、Diff 禁用、settings 提示、release blocker。 |
| 数据有没有改变？ | input 是否保持、last_session 是否写入、history 是否追加、settings 是否回滚。 |
| 如何恢复？ | 用户改 JSON、重试 HTTP、保存 key、打开权限、重新打包、查看日志。 |

这四个问题是 [S03-error-model.md](S03-error-model.md) 的核心，也是其他 spec 写失败场景时的最低要求。
