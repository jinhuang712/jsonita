# Jsonita TODO

> This Markdown file is the project-level TODO source. Completed items are recorded in [`CHANGELIST.md`](CHANGELIST.md).

## Open

### TODO-P1-01 · App icon should adapt to system theme

- 问题：macOS 启动器、Spotlight、Dock 或应用入口里的 Jsonita logo 目前没有根据系统 light / dark theme 自动切换黑白版本。
- 关闭条件：提供可验证的 light / dark 图标资源或生成链路，并确认安装后的 `.app` 在系统主题变化时展示正确的图标版本。

### TODO-P1-03 · Search match highlight should be more visible

- 问题：编辑器搜索命中文本的高亮对比度不够，尤其在 dark theme 下当前匹配和普通文本区分不明显。
- 关闭条件：搜索当前匹配和其他匹配都具备足够可见的背景、描边或文字对比度，并在 `design/screens.md`、`design/prototype/index.html` 和真实 app UI 中保持一致。

### TODO-P2-01 · Logging RedactLayer still a no-op placeholder

- 问题：`src-tauri/src/logging/redact.rs` 的 `on_event` 不做任何脱敏；当前隐私保护完全依赖调用点自律。现有 9 个 tracing 调用点经审核全部只记元数据（无文档内容 / key），但缺少机制兜底。
- 关闭条件：实现字段名黑名单脱敏（须走包装型 MakeWriter 或 fmt-layer 字段过滤器，tracing Layer 的 on_event 无法改写 event）。`api_key` / `access_token` / `password` → 完全拒绝；`content` / `text` / `body` / `raw` → 改记 `len + sha256[:8]`。
