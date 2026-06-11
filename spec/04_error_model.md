# 错误模型

错误模型定义 Jsonita 失败时“系统如何保持可理解、可恢复、不丢数据”。它不是一张 enum 表，而是所有模块共享的失败语义。

## 读完这篇你应该知道

- 哪些失败可以继续编辑，哪些失败需要用户动作。
- Rust 错误如何跨 IPC 到前端。
- UI 在失败时必须保留哪些信息。
- 哪些失败绝不能变成静默成功。

## 失败语义

| 类型 | 例子 | UI 应该怎么做 | 数据规则 |
| --- | --- | --- | --- |
| 可恢复 | JSON parse error、unwrap timeout | 标出位置或原因，让用户继续编辑 | 不覆盖 input。 |
| 可重试 | HTTP 失败、rate limit | 展示状态码或 retry-after | 保留请求上下文。 |
| 需要用户动作 | AI disabled、missing key、secrets write failure | 指向 settings 或权限问题 | 不假装保存成功。 |
| 基础设施失败 | SQLite IO、Tauri transport、日志导出失败 | 展示通用失败和 support 路径 | 不产生半成功状态。 |
| 非法输出 | AI 返回不是合法 JSON | 不显示 Accept | 原始输入保持权威。 |

## 跨边界传递

Rust 侧的业务失败统一映射为 `JsonitaError`。前端可以把 `kind` 映射成用户语言，但不能丢失 `kind` 或 payload。日志和 issue 报告也依赖稳定 `kind` 来定位问题。

前端本地也会产生一些 UI 状态，例如 empty、large file、stale response。这些不一定跨 IPC，但应遵守同样原则：不覆盖用户输入、不制造假成功。

## 用户可见结果

Parse 失败时，用户应该看到 invalid 状态、editor 位置提示，以及可选 AI Fix 入口。Storage 失败时，当前 editor 内存状态不应丢失，但保存/恢复动作要明确失败。AI 失败时，AI pane 显示可行动原因，Diff 不出现或不可 Accept。

日志或导出失败不应该影响 JSON 编辑主流程，但 support action 本身要有失败反馈。

## 不做什么

错误模型不定义中文/英文文案、不定义 icon、不定义具体组件布局。这些归 `design/02_interaction.md` 和 `design/14_i18n_a11y.md`。这里定义的是行为语义。

## 附录

- 完整 `JsonitaError` enum、TS mirror 和 payload 字段见 [appendix/schemas.md](appendix/schemas.md)。
- command 到错误分支的明细见 [appendix/ipc-api.md](appendix/ipc-api.md)。
- AI 上游错误映射见 [appendix/ai-protocol.md](appendix/ai-protocol.md)。
