# M0-N3 · 浮窗 POC（NSPanel-like 行为）

## Goal

通过 cocoa `unsafe` API 把 Tauri 主窗口转为 NSPanel ── 拥有 `nonactivatingPanel`（呼出不抢焦点）+ `fullScreenAuxiliary`（fullscreen App 上仍可见）+ `HUDWindow` styleMask；失焦自动隐藏；多屏定位（呼出到鼠标所在屏）。WebView 内只放一个空白 React 组件占位 ── 实际 UI 留 M1。

## Context

- [`progress/01_m0_skeleton.html#m0-n3-nspanel`](../01_m0_skeleton.html#m0-n3-nspanel)
- [`spec/06_window.html`](../../spec/06_window.html) § 2 NSPanel 标志位表 § 3 close 路由 § 4 失焦隐藏 § 5 窗口生命周期 § 9.2 多屏定位算法
- [`spec/01_mockups.html`](../../spec/01_mockups.html) § 1 主浮窗 6 态 ── 视觉锁定

## Write Scope

- `src-tauri/Cargo.toml`（加 `cocoa = "0.25"` · `objc = "0.2"` 仅 `[target.'cfg(target_os = "macos")']` 段）
- `src-tauri/src/window/mod.rs`（模块入口 + Window trait 包装）
- `src-tauri/src/window/nspanel.rs`（cocoa unsafe ── 设置 styleMask / collectionBehavior / 失焦回调；全文用 `#[cfg(target_os = "macos")]` 包）
- `src-tauri/src/window/locate.rs`（多屏定位 ── 用 `NSScreen::screens` + 鼠标坐标）
- `src-tauri/src/main.rs`（启动时调 `convert_to_nspanel(window)`）
- `src/components/PanelShell.tsx`（空白 React 容器；显示 "Paste JSON to start" placeholder 文本即可）

## Do Not Touch

- 任何 JSON 引擎 / CodeMirror → M1-N2 / N3
- 任何 SQLite / 会话 → M1-N6 / N7
- 智能宽度 → M1-N9（M0 用固定初始尺寸 640×480 即可）
- Windows 端窗口实现 ── 用 `#[cfg(not(target_os = "macos"))]` 跳过，M3-N5 再做

## Deliverables

- [x] cocoa NSPanel 三标志全部 set 成功（启动后用 macOS Window 工具查 styleMask 应含 `NSWindowStyleMaskNonactivatingPanel`）
- [x] 失焦事件 → 调 `window.hide()`；切回前台后 hide 状态保留
- [x] 多屏定位：鼠标在外接屏 → 浮窗出现在外接屏；鼠标在内置屏 → 内置屏
- [x] fullscreen App 测试：在 Safari 全屏下按 M0-N4 提供的快捷键，浮窗仍在最上层
- [x] **关键不变量**：呼出时主前台 App 焦点不被抢

## Verification

```bash
# 1. 编译
cargo build --manifest-path src-tauri/Cargo.toml

# 2. 运行验证（手动 ── 配合 M0-N4 完成后）
pnpm tauri dev
# - 按 ⌘⇧J（M0-N4 提供）
# - Safari 仍是前台 App（关键！）
# - 浮窗在鼠标所在屏出现
# - 点 Safari 任意位置 → 浮窗消失
# - Safari 全屏 → 按 ⌘⇧J → 浮窗仍可见

# 3. styleMask 检查（macOS Activity Monitor / WindowManager）
# 调试时 println! NSWindow 的 styleMask 数值看 nonactivatingPanel bit 是否 set
```

## Acceptance Mapping

- M0-A4 ── Safari 仍是前台
- M0-A6 ── 失焦消失
- M0-A7 ── fullscreen 上可见
- M0-A8 ── 多屏鼠标所在屏

## Stop And Ask / Update Spec When

- spec/06 § 2 标志位组合在 macOS 15+ 上行为变化 → 回改 spec/06 + 加 cfg 标注
- macOS 11 Big Sur 上 `fullScreenAuxiliary` 不生效 → spec/12 § 1 `minimumSystemVersion` 是否抬高到 12？**用户决策**
- 失焦自动隐藏与"用户主动手动拖窗口"的事件冲突 → 设计上需要 timer debounce，更新 spec/06 § 4

## Notes

- cocoa 调用全 `unsafe`，必须 `#[cfg(target_os = "macos")]` 包裹避免 Linux/Windows 编译失败
- styleMask 必须在 window **创建后立即** set（before show）── show 后 set 部分标志会被 macOS 忽略
- 失焦事件用 `tauri::WindowEvent::Focused(false)` 监听；hide 时不 destroy（保留 webview 状态）
- 完成后 commit：`feat(m0-n3): nspanel-like floating window (cocoa unsafe)`
