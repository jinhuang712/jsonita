# M0-N4 · 全局快捷键 + Accessibility 权限引导

## Goal

注册 `⌘⇧J` 全局快捷键 ── 在**任何**前台 App 下都能呼出浮窗（M0-N3）。macOS Accessibility 权限缺失时弹引导 Modal 指引用户授权；授权后**不重启**即可使用。

## Context

- [`progress/01_m0_skeleton.html#m0-n4-shortcut`](../01_m0_skeleton.html#m0-n4-shortcut)
- [`spec/07_menubar.html`](../../spec/07_menubar.html) § 4 global-shortcut § 5 macOS Accessibility 权限策略
- [`spec/01_mockups.html`](../../spec/01_mockups.html) § 7 权限引导 Modal 视觉

## Write Scope

- `src-tauri/Cargo.toml`（加 `tauri-plugin-global-shortcut`）
- `src-tauri/src/shortcuts/mod.rs`（注册 + 注销 + 权限检测）
- `src-tauri/src/main.rs`（启动时 setup shortcut + 检测权限发 event）
- `src/permissions/AccessibilityModal.tsx`（引导 Modal ── 文案 / 跳"系统设置 → 隐私 → 辅助功能"按钮）
- `src/App.tsx`（监听 `permission:accessibility_missing` event 自动弹 Modal）

## Do Not Touch

- 自定义快捷键 UI → M2-N5（M0 默认 `⌘⇧J` 硬编码）
- 冲突检测（与系统保留 / Jsonita 内部撞）→ M2-N5
- 菜单栏 menu 的 accelerator 文字同步 → M2-N5
- Windows 全局快捷键（用 `#[cfg(target_os = "macos")]` ── Windows 端的 hot-key 留 M3-N5）

## Deliverables

- [x] `⌘⇧J` 在 Safari / 终端 / Finder / Xcode 等前台都能呼出浮窗
- [x] 启动时检测 Accessibility 权限 ── 缺失则发 event `permission:accessibility_missing`
- [x] 前端收 event → 自动弹引导 Modal（含"打开系统设置"按钮）
- [x] 用户在系统设置授权后，回到 Jsonita 不需重启即可呼出（验证动态注册 / 权限缓存刷新）
- [x] 权限引导 Modal 文案走 `useTranslation`（M0-N6 i18n 框架接入）

## Verification

```bash
# 1. 编译
cargo build --manifest-path src-tauri/Cargo.toml

# 2. 手动验收
# 准备：先去系统设置 → 隐私 → 辅助功能 → 把 Jsonita 删了（如有）
pnpm tauri dev
# - 启动 → 引导 Modal 自动弹（M0-A9）
# - Modal 点"打开系统设置"→ 跳到正确页
# - 把 Jsonita 加入授权列表
# - 回 Jsonita → 不重启按 ⌘⇧J → 浮窗呼出（M0-A10）
# - 测试 Safari / 终端 / Finder 各按 ⌘⇧J 都能呼出

# 3. 关闭 Modal 后能从设置或菜单"重新检查权限"重新触发
```

## Acceptance Mapping

- M0-A4 任意前台 App 呼出
- M0-A9 / A10 权限引导 + 授权后无需重启
- E2 退出条件直接对应

## Stop And Ask / Update Spec When

- spec/07 § 4 的快捷键设计与 `tauri-plugin-global-shortcut` 实际 API 不一致 → 回改 spec/07
- 在 macOS 14+ 上 Accessibility 权限缓存策略变化（如新机制） → 回改 spec/07 § 5 + 加 cfg
- 想换默认快捷键（如 `⌥Space` 而非 `⌘⇧J`） → **绝对不替用户决定**，必须问

## Notes

- 首次启动 Accessibility 权限**一定**缺失 ── 引导 Modal 必须在 `onMount` 检测**主动**弹（不能被动等用户搜）
- 注册失败时 fail-loud：Toast.danger + 不要静默
- `tauri-plugin-global-shortcut` 在 macOS 内部用 `Carbon` API ── 与 Karabiner-Elements 等重映工具有冲突可能（极少；M2 加冲突检测时再观察）
- 完成后 commit：`feat(m0-n4): global shortcut + accessibility guide modal`
