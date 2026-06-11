# 前端执行

前端执行层决定用户正在看什么、哪个 pane 生效、preview 如何更新、single-pane 何时 apply、Tree 何时渲染、AI Fix 何时进入 Diff 决策。它是 UI 状态的权威，但不是持久化数据的权威。

## 读完这篇你应该知道

- editor 文本、output、status、pane、AI 状态如何协作。
- 双栏模式和单窗模式的执行差异。
- Tree view 为什么不是 command 动作。
- 前端失败时为什么不能覆盖用户输入。

## 前端状态模型

| 状态 | 说明 | 权威位置 |
| --- | --- | --- |
| `inputText` | 用户当前编辑的文本 | WebView 内存状态。 |
| `activePane` | Format、Minify、Tree、String、AI Fix 等当前工作视图 | WebView。 |
| `previewResult` | 最近一次成功或失败的 preview 结果 | WebView，按请求序号防过期。 |
| `status` | Valid、Invalid、Empty、Large、AI loading/error 等状态 | WebView，由当前输入和最新响应推导。 |
| `settingsSnapshot` | 当前 UI 使用的设置快照 | Rust 是真相，前端只缓存。 |
| `aiDecision` | AI Fix loading、diff、accepted、cancelled、error | WebView。 |

前端可以临时缓存这些状态，但跨重启、跨窗口、跨进程的真相都不在前端。

## Pane 执行路径

Format、Minify、JSON to String、String to JSON 都是“输入文本 → Rust JSON command → output”。双栏模式下结果显示在右侧；单窗模式下先显示当前工作视图，用户按 `Cmd+Enter` 才把成功结果写回 input。

Tree 是例外。Tree 是对合法 JSON 的视图，不是变换动作。切到 Tree 且 JSON 合法时，主区域直接显示树；JSON 非法或为空时显示明确状态，不出现 `Cmd+Enter` Run 提示。

AI Fix 也是例外。它不是普通 apply pane，而是一个决策流程：进入 AI pane 后发起修复，成功后展示 DiffView，Accept 才覆盖 input，Cancel 保留原文。

## Preview 与过期响应

用户输入会触发 debounce preview。每次请求带有递增序号，返回时只有最新序号能更新 UI。旧响应即使成功，也不能覆盖新输入对应的状态。

这个规则解决两个问题：一是用户快速输入时不会看到旧结果闪回；二是慢命令、AI 或 IPC 抖动不会把 UI 变成过期状态。

## 输入覆盖规则

前端只有在明确用户意图下才能覆盖 input：single-pane 的 `Cmd+Enter` apply，或 AI Diff 的 Accept。preview 成功不能自动改 input；parse 失败、AI 失败、IPC 失败更不能改 input。

`Cmd+K` 是显式清空输入，同时触发 last_session 清理，避免之后恢复出空白 session。

## Tree 与复制交互

Tree view 维护自己的 hover/focus 复制状态。leaf 复制 raw value，object/array 复制 pretty JSON subtree，点击 key 可以复制 path。Tree 容器内的 `Cmd+A`/`Cmd+C` 行为只作用于 Tree，不允许触发浏览器整页选择。

视觉与交互细节在 `design/01_mockups.md`、`design/02_interaction.md`、`design/08_editor.md`，这里不重复画 UI。

## 失败语义

Parse 错误展示在状态栏、editor lint 和必要的错误说明中，input 保持不变。大文件超限时前端不应继续频繁请求 JSON engine。AI 错误保持原文并显示可行动信息。IPC transport 错误落到 [04_error_model.md](04_error_model.md)。

## 附录

- pane 到 command 的完整映射见 [appendix/ipc-api.md](appendix/ipc-api.md)。
- JSON engine option 字段见 [appendix/schemas.md](appendix/schemas.md)。
- Diff props 和 AI payload 见 [appendix/ai-protocol.md](appendix/ai-protocol.md) 与 [appendix/schemas.md](appendix/schemas.md)。
