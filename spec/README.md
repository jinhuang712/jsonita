# Spec 文档入口

Jsonita 的 spec 分成两层：核心文档和附录。

核心文档是默认阅读路径。一个 coding agent 或开发者只读核心文档，就应该能理解系统怎么分层、能力怎么协作、关键状态如何流转、失败时用户会看到什么，以及哪些细节需要再查附录。

附录不是第二套 spec，也不是默认阅读路径。附录只保存完整字段表、命令签名、事件表、SQL DDL、prompt 模板、日志字段、打包命令、测试矩阵等低频明细。

## 阅读顺序

1. 先读 [00_system_architecture.md](00_system_architecture.md)，建立全局分层和数据流。
2. 按任务选择对应核心 spec：运行时读 01，前端执行读 02，IPC 读 03，错误读 04，安全读 05，JSON engine 读 06，存储读 07，AI 读 08，日志读 09，打包读 10。
3. 只有需要字段、DDL、命令签名、prompt 或配置块时，再进入 [appendix/README.md](appendix/README.md)。

## 核心 Spec

| 文档 | 读完应该知道 |
| --- | --- |
| [00_system_architecture.md](00_system_architecture.md) | Jsonita 的双进程架构、层次边界、主数据流和模块协作方式。 |
| [01_runtime_lifecycle.md](01_runtime_lifecycle.md) | App 从启动、常驻、呼出、隐藏到退出的生命周期，以及为什么关闭只是隐藏。 |
| [02_frontend_execution.md](02_frontend_execution.md) | WebView 如何管理 editor、pane、Tree、single-pane、AI Fix 和可见状态。 |
| [03_ipc_boundary.md](03_ipc_boundary.md) | React 与 Rust 如何通过 IPC 协作，哪些能力只能在 Rust 侧执行。 |
| [04_error_model.md](04_error_model.md) | 错误如何分类、跨边界传递、在 UI 呈现，并如何避免数据损坏。 |
| [05_security_privacy.md](05_security_privacy.md) | 本地数据、secrets、AI 外发、日志脱敏和 WebView 权限边界。 |
| [06_json_engine.md](06_json_engine.md) | JSON 格式化、压缩、互转和嵌套解包的技术路径与失败语义。 |
| [07_storage_session.md](07_storage_session.md) | SQLite、settings、window、secrets、history、last_session 的数据主权。 |
| [08_ai_repair.md](08_ai_repair.md) | AI Fix 的触发条件、请求构造、响应校验、Diff 决策和失败处理。 |
| [09_logging_observability.md](09_logging_observability.md) | 本地日志、事件分类、脱敏、滚动文件和 support workflow。 |
| [10_packaging_distribution.md](10_packaging_distribution.md) | v1 beta 打包路径、版本一致性、签名/公证边界和发布失败语义。 |

## 主权对象

| 主权对象 | 唯一定义位置 | 其他文档如何使用 |
| --- | --- | --- |
| 系统分层与进程边界 | [00](00_system_architecture.md) | 其他 spec 只引用，不重新定义双进程模型。 |
| 运行时生命周期 | [01](01_runtime_lifecycle.md) | window、tray、shortcut、hide/quit 语义以此为准。 |
| 前端执行状态 | [02](02_frontend_execution.md) | pane、preview、apply、Tree、AI Fix 的可见状态以此为准。 |
| IPC 边界 | [03](03_ipc_boundary.md) | 命令/事件语义以此为准，完整签名在附录。 |
| 失败语义 | [04](04_error_model.md) | 各模块只说明本模块如何落到统一错误模型。 |
| 本地数据与隐私边界 | [05](05_security_privacy.md) | 存储、AI、日志、打包都不能突破该边界。 |
| JSON 变换语义 | [06](06_json_engine.md) | UI/IPC/存储只调用，不重新解释算法。 |
| 持久化数据主权 | [07](07_storage_session.md) | SQLite、settings、window、secrets、session 只在这里定义所有权。 |
| AI 修复流程 | [08](08_ai_repair.md) | prompt、wire、diff 细节在附录，但流程以此为准。 |
| 日志与可观测性 | [09](09_logging_observability.md) | 日志字段和事件表在附录，边界以此为准。 |
| 发布产物契约 | [10](10_packaging_distribution.md) | 脚本和配置在附录，发布门禁以此为准。 |

## 写作规则

1. 核心 spec 用中文写系统说明，不写成英文规则摘要。
2. 核心 spec 必须讲清楚职责边界、协作路径、关键状态、失败语义和用户可见结果。
3. 影响行为的字段、状态、事件或规则必须在核心 spec 点名；完整字段展开放附录。
4. 附录只能保存需要查证的明细，不承载系统理解主线。
5. 不新增文字画图；用自然语言、步骤、表格或设计资产表达结构。
