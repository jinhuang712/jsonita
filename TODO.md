# Jsonita TODO

> 本文件只列**未规划入 spec** 的疑似工作。
> 实施期 session-level 步骤进 `TaskCreate`。
> 结构化源数据见 [`site/todo.json`](site/todo.json)，静态页面见 [`todo.html`](todo.html)。

## 未分到对应 Phase 的疑似工作

- [ ] 崩溃恢复 / 数据完整性 spec 增补（SQLite 损坏 / settings.json 损坏的处理）── 实施期遇到再回补到 spec/10
- [ ] 安全合规审计清单 spec 增补（macOS App Store / 企业部署可能需要的合规材料）── v2 路线，v1 不做

## 🎨 玻璃视觉重设计 + 单窗交互 + 动画

阶段 1 / 2 / 3 已按 `design/HANDOFF.md` 落地并同步到 `spec/` / `plan/` / `CHANGELIST.md`。后续如继续打磨玻璃质感，另开明确需求再新增 backlog。

- [ ] **macOS 上 `cargo build` / `tauri dev` 验收原生 vibrancy + 主题解析**（前端 `tsc` 通过，但 cocoa/objc 在非 macOS 沙箱编不了）。验收点：①light/dark 切换时磨砂材质实时跟随、dark 不再发灰（若不够暗，把 `apply_glass_mode` dark 分支 `HudWindow` 换 `UnderWindowBackground`）；②**system 模式跟随 OS**：OS 为 dark 时从 light 切到 system 立即变 dark；app 运行中改 OS 主题，system 模式实时跟随；fresh launch + dark OS 直接 dark。

## CAST 文档源数据

- [ ] 为 `site/todo.json` / `site/changelist.json` 增加自动渲染脚本，减少 `todo.html` / `changelist.html` 手工同步成本。
