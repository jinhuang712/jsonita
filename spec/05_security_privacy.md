# 安全与隐私

Jsonita 的默认安全模型是 local-first。用户 JSON、历史、设置、窗口状态、API key、日志都默认留在本机。唯一主动离开本机的数据，是用户启用并触发 AI Fix 时发送给 DeepSeek 的当前修复请求。

## 读完这篇你应该知道

- WebView 为什么不能直接访问本地资源。
- API key 为什么存 `secrets.json`，不是 Keychain。
- AI 外发的边界是什么。
- 日志和 support 流程不能记录哪些东西。

## 本地数据边界

| 数据 | 存放位置 | 规则 |
| --- | --- | --- |
| 当前编辑文本 | WebView 内存 | 默认不持久化，除非合法 transform 更新 last_session/history。 |
| History / last_session | SQLite | Rust 侧唯一读写。 |
| Settings | settings.json | Rust store 负责默认值、patch 和事件通知。 |
| Window state | window.json | 记录尺寸和智能缩放相关状态。 |
| API key | secrets.json | 限当前用户权限，不能进 settings、日志或 event payload。 |
| Logs | 本地 rolling files | 只记录诊断字段，不记录 JSON 文档内容或 API key。 |

## WebView 权限边界

WebView 被当作不可信 UI 环境处理。它可以展示和编辑文本，但不能直接读写 filesystem、SQLite、secrets、clipboard、global shortcut 或网络。需要这些能力时必须通过 [03_ipc_boundary.md](03_ipc_boundary.md)。

这样做的结果是：即使前端组件出现 bug，持久化和外发能力仍集中在 Rust 侧，便于审计、测试和脱敏。

## Secrets 策略

API key 存在 app data 目录下的 `secrets.json`，并设置受限文件权限。这个项目明确不把 Keychain 作为 API key 存储路径，因为 Keychain 会引入 codesign identity、弹窗、迁移和调试上的不稳定成本，不适合当前小工具的 v1 beta。

Settings UI 可以显示“是否已有 key”和 mask 状态，但不能通过 settings payload 返回明文 key。

## AI 外发边界

AI 默认关闭。关闭时，前端隐藏或禁用入口，Rust command 仍必须拒绝请求。开启后，只有用户当前要修复的文本、parse line/column/message 这类上下文可以进入 AI 请求。

History、settings、logs、secrets、window state 不会被自动上传。测试连接使用输入框当前值，不依赖也不消耗已保存 key。

## 日志边界

日志用于本地诊断，不是 telemetry。日志可以记录 command 名、耗时、错误 kind、状态码、文件路径类别，但不能记录 JSON 文档内容、API key、DeepSeek raw prompt 中的用户 JSON、剪贴板全文。

## 失败语义

Secrets 写失败必须阻止“保存成功”的 UI。AI disabled 必须阻止网络请求。日志失败不能退化成把敏感 payload 写到其他地方。权限失败需要给用户明确入口，而不是静默失败。

## 附录

- secrets/settings/window schema 见 [appendix/schemas.md](appendix/schemas.md)。
- DeepSeek request/response 明细见 [appendix/ai-protocol.md](appendix/ai-protocol.md)。
- 日志字段和脱敏规则见 [appendix/logging-details.md](appendix/logging-details.md)。
- Tauri capabilities 和 entitlements 见 [appendix/packaging-details.md](appendix/packaging-details.md)。
