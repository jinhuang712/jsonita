# Jsonita TODO

> This Markdown file is the project-level TODO source. Completed documentation migration work is recorded in [`CHANGELIST.md`](CHANGELIST.md).

## Open

### TODO-P1-01 · App icon should adapt to system theme

- 问题：macOS 启动器、Spotlight、Dock 或应用入口里的 Jsonita logo 目前没有根据系统 light / dark theme 自动切换黑白版本。
- 关闭条件：提供可验证的 light / dark 图标资源或生成链路，并确认安装后的 `.app` 在系统主题变化时展示正确的图标版本。

### TODO-P1-02 · Main window should show a small app logo

- 问题：Jsonita app 本体左上角缺少小尺寸 logo，主窗口品牌识别只出现在系统 app icon / 外部入口中。
- 关闭条件：主窗口左上角展示低干扰的小 logo，并在 `design/prototype/index.html`、真实 app UI 和相关设计文档中保持一致。

### TODO-P1-03 · Search match highlight should be more visible

- 问题：编辑器搜索命中文本的高亮对比度不够，尤其在 dark theme 下当前匹配和普通文本区分不明显。
- 关闭条件：搜索当前匹配和其他匹配都具备足够可见的背景、描边或文字对比度，并在 `design/prototype/index.html`、真实 app UI 和相关设计文档中保持一致。

### TODO-P1-04 · AI Fix loading state needs stronger centered feedback

- 问题：AI Fix 进行中的提示太小、缺少动画，并且没有在可视工作区中真正居中，用户难以确认当前处于等待修复状态。
- 关闭条件：AI Fix requesting 状态提供居中的、更明显的 loading 反馈和克制动画，并在 `design/prototype/index.html`、真实 app UI 和相关设计文档中保持一致。
