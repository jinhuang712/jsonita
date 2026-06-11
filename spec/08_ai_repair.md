# AI Repair

AI Fix 是一个可选修复流程，不是 Jsonita 的基础能力。它只在用户启用 AI、存在 API key、并明确进入修复路径时运行。AI 的输出必须先被校验为合法 JSON，再交给用户通过 Diff 决策是否应用。

## 读完这篇你应该知道

- AI Fix 什么时候可以运行，什么时候必须拒绝。
- 请求里能发送哪些上下文。
- 模型输出如何被提取和校验。
- 为什么 Accept 前必须经过 Diff。

## 前置条件

AI Fix 只有在以下条件都满足时才可运行：settings 中 `aiEnabled` 为 true；secrets.json 中有可用 API key；用户当前处于可修复的错误状态或显式触发 AI 修复；请求文本来自当前 editor。

即使前端误显示入口，Rust command 仍必须在 AI disabled 或 key 缺失时拒绝请求。

## 请求流程

1. 前端进入 AI Fix pane，记录当前 input 和 parse error context。
2. 前端调用 `ai_fix`，带 requestId 防止重复请求混淆。
3. Rust 从 secrets store 读取 API key。
4. Rust 构造 system prompt 和 user prompt，只发送当前修复文本及必要错误位置。
5. DeepSeek 返回后，Rust 提取可能被包裹的 JSON。
6. Rust 用 JSON engine 校验输出必须是合法 JSON。
7. 成功后返回 fixed JSON 和元信息。
8. 前端展示 DiffView。
9. 用户 Accept 才覆盖 input；Cancel 保留原文。

## Prompt 边界

Prompt 的目标是让模型只返回修复后的 JSON，不解释、不加 Markdown、不发散。系统不能把 history、settings、secrets、日志、窗口状态等上下文塞进 prompt。

如果模型输出非法 JSON，系统不能让用户 Accept；可以保留 raw output 作为诊断材料，但需要遵守日志脱敏规则。

## Diff 决策

AI 输出即使合法，也不是自动可信结果。DiffView 是用户确认边界。Accept 表示用户允许覆盖 editor，后续才可能写 history/last_session。Cancel 和关闭 pane 都不改变 input。

## 失败语义

AI disabled、missing key、secrets failure、HTTP failure、rate limit、invalid model output 都必须保持原 input。Rate limit 保留 retry-after。HTTP 错误展示状态摘要。invalid JSON 不提供 Accept。

## 附录

- Prompt 模板、DeepSeek wire protocol、request 默认值、Diff props 见 [appendix/ai-protocol.md](appendix/ai-protocol.md)。
- AI request/response payload 字段见 [appendix/schemas.md](appendix/schemas.md)。
