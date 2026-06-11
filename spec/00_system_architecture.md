# 系统架构

Jsonita 是一个 macOS 菜单栏 JSON 工具。用户通过 `Cmd+Shift+J` 呼出一个轻量浮窗，在里面完成格式化、压缩、Tree 查看、JSON/string 互转和 AI 修复。系统架构的核心目标不是做一个复杂 IDE，而是让这个小工具在本地、快速、可恢复、可验证的边界内工作。

## 读完这篇你应该知道

- Jsonita 为什么分成 Rust host 与 React WebView 两个执行世界。
- 哪些能力属于 UI 状态，哪些能力必须在 Rust 侧执行。
- 一次 JSON 变换从用户输入到结果呈现会经过哪些层。
- 为什么存储、AI、日志、安全不能被前端绕过。

## 系统分层

| 层 | 运行位置 | 主要职责 | 不能做什么 |
| --- | --- | --- | --- |
| 浮窗 UI | React WebView | 编辑器、Tab、Tree、设置面板、状态栏、Diff 决策 | 不能直接读写文件、SQLite、secrets、网络或系统权限。 |
| 前端执行层 | React store/hooks | 管理当前文本、pane、preview 请求序号、single-pane apply、AI UI 状态 | 不拥有持久化真相。 |
| IPC 边界 | Tauri invoke/listen | 把前端意图变成 Rust command，把 Rust 状态变化变成 event | 不承载 UI 布局决策。 |
| Rust domain | Rust modules | JSON engine、AI client、storage、logging、settings、window/system service | 不直接修改 DOM 或 React 状态。 |
| 本地持久化 | Rust-owned files/SQLite | history、last_session、settings、window、secrets、logs | 不让 WebView 绕过 Rust 直接访问。 |

这种分层让 JSON engine 可以保持纯函数，存储和 secrets 可以集中处理，AI 外发可以被单一边界控制，日志也能统一脱敏。

## 关键技术取舍

Rust host 是系统能力的唯一入口。菜单栏、全局快捷键、窗口控制、SQLite、文件权限、DeepSeek HTTP、日志文件都在 Rust 侧，因为这些能力涉及系统权限、持久化或隐私边界。

WebView 只负责交互体验。它可以缓存当前 editor 文本和 UI 状态，但这些状态不是持久化真相。需要保存、恢复、读写配置、调用 AI 或打开系统路径时，都必须通过 IPC。

JSON engine 被刻意放在 Rust domain 中，并保持无 UI 副作用。这样格式化、压缩、stringify、unwrap 都能被单测覆盖，也不会因为 UI 状态污染核心逻辑。

## 一次变换怎么走

1. 用户在 CodeMirror 输入或粘贴 JSON。
2. 前端执行层根据当前 pane 和设置决定是否发起 preview。
3. WebView 通过 IPC command 把文本和选项传给 Rust。
4. Rust command 把 CPU 变换交给 JSON engine，或把 IO 操作交给对应 storage/logging/AI service。
5. Rust 返回成功 payload 或结构化错误。
6. 前端只接受最新请求序号对应的响应，忽略过期响应。
7. UI 更新 output、status、lint marker、Tree 或 Diff，不让 Rust 直接改 editor。

这个流程的关键约束是：请求可以异步返回，但可见状态必须由前端按最新用户输入决定；Rust 不反向覆盖 UI。

## 模块协作

| 能力 | 前端负责 | Rust 负责 | 关键边界 |
| --- | --- | --- | --- |
| Format/Minify/Stringify | 收集当前文本、展示结果、single-pane apply | 解析和生成 JSON 字符串 | 成功结果能展示或应用，失败不能覆盖输入。 |
| Tree | 在 Tree pane 可见时渲染树和复制交互 | 提供必要的解析结果或校验能力 | Tree 是视图，不是变换动作。 |
| Settings | 展示控件、响应 `settings:changed` | 读写 settings.json 并补默认值 | settings 持久化真相在 Rust。 |
| History/Session | 触发保存/恢复动作 | SQLite 写入、裁剪、读取 last_session | history 和 last_session 是两个不同概念。 |
| AI Fix | 进入 loading/Diff/Accept/Cancel 状态 | 读 secrets、组 prompt、调 DeepSeek、校验 JSON | AI 关闭或 key 缺失时 Rust 必须拒绝。 |
| Logging | 发送必要的前端事件 | 写本地日志、脱敏、滚动、导出 | JSON 内容和 API key 永不入日志。 |

## 失败语义

架构层不允许静默吞掉跨边界失败。任何 Rust command 失败都必须落到 [04_error_model.md](04_error_model.md) 定义的统一错误模型。前端可以决定如何展示，但不能丢失 `kind`、retry-after、parse location 等影响行为的信息。

失败时的默认原则是保留用户输入。Parse 失败、AI 输出非法、storage 写入失败、IPC transport 失败，都不能把 editor 改成半成功状态。

## 附录

- 完整命令、事件、payload 字段见 [appendix/ipc-api.md](appendix/ipc-api.md) 与 [appendix/schemas.md](appendix/schemas.md)。
- JSON engine 细节和测试样例见 [appendix/json-engine-details.md](appendix/json-engine-details.md)。
- 打包配置、日志字段、AI 协议等低频细节见 [appendix/README.md](appendix/README.md)。
