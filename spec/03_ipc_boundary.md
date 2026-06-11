# IPC 边界

IPC 是 React WebView 与 Rust host 之间唯一的能力通道。凡是涉及文件、SQLite、secrets、系统窗口、全局快捷键、网络、日志持久化的动作，都必须通过 IPC 进入 Rust。

## 读完这篇你应该知道

- 哪些能力被划分成 command group。
- command 和 event 的语义差异。
- 为什么 payload 必须可序列化、可版本化、可同步到 TypeScript。
- IPC 失败如何进入统一错误模型。

## 命令分组

| 分组 | 做什么 | 典型副作用 |
| --- | --- | --- |
| `json_ops` | 格式化、压缩、stringify、unwrap、parse | 无持久化副作用。 |
| `history` | 查询、写入、裁剪、清理历史 | 写 SQLite。 |
| `session` | 保存、读取、清理 last_session | 写 SQLite 单行状态。 |
| `settings` | 读取、patch、reset settings | 写 settings.json，并 emit 变更事件。 |
| `ai` | 测试 key、保存/删除 key、AI Fix | 读写 secrets，必要时发起网络请求。 |
| `window` | show/hide/toggle/resize/theme | 控制系统窗口，写 window.json。 |
| `system` | 快捷键、剪贴板 sniff、打开路径、退出 | 调系统能力。 |
| `logging` | 前端日志、打开/导出日志目录 | 写本地日志文件。 |

核心文档只定义这些能力边界；完整签名和参数表属于附录。

## Command 与 Event

Command 表示前端主动请求 Rust 做事，返回成功 payload 或结构化错误。Event 表示 Rust 通知 WebView 某个状态变化，例如 settings changed、window shown/resized、clipboard sniff result。

Event 不能把持久化数据主权转交给前端。前端收到 event 后可以更新 UI 或重新拉取数据，但 durable truth 仍在 Rust。

## 类型同步

跨 IPC 的 Rust struct 和 TypeScript mirror 必须同步变更。Rust 字段通常用 snake_case，序列化给前端时使用 camelCase。影响行为的字段必须在对应核心 spec 点名，完整字段表放 [appendix/schemas.md](appendix/schemas.md)。

不允许在前端用临时 any 逃过字段同步；否则 settings、AI payload、error kind 和 window metrics 会逐渐漂移。

## 性能与幂等

所有 command 都按 async 调用处理。CPU 密集型 JSON 操作不能阻塞 UI 主线程；前端必须能忽略过期响应。payload 体积保持在本地工具可接受范围内，大文件策略由前端和 Rust 共同保护。

读命令应尽量幂等。写命令必须明确副作用。AI Fix 用 requestId 防止重复请求和 UI 重试造成混乱。

## 失败语义

Rust command 返回 `Result<T, JsonitaError>`。业务失败应转成统一错误对象；Tauri transport 失败属于基础设施失败，前端不能把它伪装成成功状态。

IPC 层不决定文案和布局，但必须保留调用方处理失败所需的信息，例如 parse line/column、rate-limit retry-after、secrets failure kind。

## 附录

- 完整 command/event 表见 [appendix/ipc-api.md](appendix/ipc-api.md)。
- payload、error enum、settings schema 见 [appendix/schemas.md](appendix/schemas.md)。
