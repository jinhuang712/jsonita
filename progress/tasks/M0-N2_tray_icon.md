# M0-N2 · 菜单栏 tray + 图标

## Goal

在 macOS 菜单栏注册 template icon（自动随 light/dark menubar 反色）；左键 toggle 浮窗（M0-N3 提供）；右键弹原生菜单（Toggle / Settings 占位 / Quit）。Dock 不出现图标。

## Context

- [`progress/01_m0_skeleton.html#m0-n2-tray`](../01_m0_skeleton.html#m0-n2-tray)
- [`spec/05_icons_theme.html`](../../spec/05_icons_theme.html) § 3 menubar template § 4 资源清单
- [`spec/07_menubar.html`](../../spec/07_menubar.html) § 1 tray API § 2 menu 结构 § 3 macOS 跨平台
- [`spec/01_mockups.html`](../../spec/01_mockups.html) § 3 菜单栏 tray 视觉（light/dark 对照）

## Write Scope

- `src-tauri/src/menubar/mod.rs`（新建模块）
- `src-tauri/icons/menubar/tray-iconTemplate.png` + `@2x` + `@3x`（18×18 单色 PNG，文件名**必带** `Template` 后缀，否则 macOS 不自动反色）
- `src-tauri/src/main.rs`（注册 tray、关联 menubar 模块）
- `src-tauri/tauri.conf.json`（`app.trayIcon` 段）
- `src-tauri/Cargo.toml`（`tauri = { features = ["tray-icon"] }`）

## Do Not Touch

- 浮窗本身 → M0-N3
- 全局快捷键 → M0-N4
- Settings Modal 实际内容 → M2-N1（M0 阶段右键菜单的 "Settings" 项可禁用或跳一个 placeholder）
- Dock 图标（在 tauri.conf.json 设 `macOSPrivateApi: true` + `LSUIElement: true` 让 Dock 不出现 ── 这条配置由本节点完成）

## Deliverables

- [x] 启动后菜单栏右上角出现 Jsonita template icon
- [x] light menubar → 黑色；dark menubar → 自动变白（macOS 系统切深色时也会自动跟）
- [x] Dock 无图标（验证 LSUIElement 生效）
- [x] 左键点击 tray → 触发 toggle 浮窗事件（M0-N3 接收）
- [x] 右键点击 tray → 弹原生 NSMenu（含 Toggle 浮窗 / Settings（disabled） / Quit Jsonita）
- [x] 关闭 `show_in_menubar` 设置项（M2 才有）后 tray 立刻消失 ── M0 阶段先把消息钩子留好

## Verification

```bash
# 1. 资源就位
ls src-tauri/icons/menubar/tray-iconTemplate*.png  # 三个文件：基本 / @2x / @3x

# 2. 运行验证（手动）
pnpm tauri dev
# - 菜单栏右上角看是否有 icon
# - 系统设置 → 外观 → 浅色 → icon 应黑；深色 → 应白
# - Dock 应无图标
# - 左键点 icon → 控制台日志 "toggle pressed"
# - 右键点 icon → 看到三项 Toggle / Settings / Quit
# - 点 Quit → 应用退出
```

## Acceptance Mapping

- M0-A1 验收"启动后菜单栏出现 template icon" ── 由本节点保证
- M0-A3 验收"左键单击菜单栏图标 → 浮窗呼出"── 与 M0-N3 配合（本节点出"点击事件"，N3 出"窗口"）

## Stop And Ask / Update Spec When

- spec/05 § 3 列的 menubar 资源命名约定与 macOS 实际要求冲突 → 回改 spec/05
- 发现 Tauri 2.x 的 `tray-icon` feature 与 spec/07 § 1 描述的 API 不一致 → 回改 spec/07
- 想加入"未设计过的菜单项"（如 "About" / "Help"）→ **先 plan/01 加 / 让用户确认**，不要直接加

## Notes

- template PNG 必须是**单色**透明背景；macOS 看 alpha 通道反色
- 文件名末必带 `Template`（如 `tray-iconTemplate@2x.png`）── 漏 Template 后缀会让 icon 在 dark menubar 下变黑色不可见
- 设计稿来源：[`spec/05_icons_theme.html`](../../spec/05_icons_theme.html) § 2 资源源
- 完成后 commit：`feat(m0-n2): menubar tray + template icons`
