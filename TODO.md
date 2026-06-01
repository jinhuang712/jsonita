# Jsonita TODO

> 本文件只列**未规划入 spec** 的疑似工作。
> 实施期 session-level 步骤进 `TaskCreate`。

## 未分到对应 Phase 的疑似工作

- [ ] 崩溃恢复 / 数据完整性 spec 增补（SQLite 损坏 / settings.json 损坏的处理）── 实施期遇到再回补到 spec/10
- [ ] 安全合规审计清单 spec 增补（macOS App Store / 企业部署可能需要的合规材料）── v2 路线，v1 不做

## 🎨 玻璃视觉重设计 + 单窗交互 + 动画（设计已定稿 → 见 `design/HANDOFF.md`）

> 设计探索已完成并定稿（原生玻璃方向）。可视参考件：`design/*.html`（浏览器直接开）。
> 全部数值（玻璃材质 / 调色 / 动画曲线 / 时长 / 单窗交互）都在 `design/HANDOFF.md`，实现时照抄。
> 实现锁定顺序 **阶段 1 → 2 → 3**；阶段 3 需 build 验证。一切走 CLAUDE.md：多轨同步、commit 不 push。

### 阶段 2 · 动画（macOS 手感）
- [ ] 接上浮窗 summon / dismiss 过渡（`spec/06 §2.5` 现状未接）：summon opacity + scale .96→1 + translateY，150ms；dismiss 更快 140ms
- [ ] Tab 切换 active 药丸滑动 + 内容 cross-fade ≤120ms；AI Fix tab 从右滑入 + 一次性琥珀微光（不循环）
- [ ] 主题切换全局色 ~180ms 交叉淡（仅手动切触发，初次加载不触发，防 FOUC）；守 `prefers-reduced-motion`；**不动 `backdrop-filter`**

### 阶段 3 · 玻璃重绘（大，需原生 + build 验证）
- [ ] Tauri `tauri.conf.json` 窗口 `transparent: true` + macOS `NSVisualEffectView` vibrancy（`spec/06`）
- [ ] `src/styles/tokens.css` 切玻璃调色板（`design/HANDOFF.md` §2/§3）light + `[data-theme="dark"]`
- [ ] 统一 `assets/style.css` token 到 `src/styles/tokens.css`（修评审发现的调色板不一致：`--primary` / `--accent` / `--info`）
- [ ] 重绘 `spec/01_mockups.html` 为玻璃（现行 flat 权威，实现后替换）：AI Fix 琥珀 / op-chip 四色 / 全 SVG 图标 / 去 reserved 行
- [ ] `cargo build` + `tauri dev` 验收磨砂效果 + 跑手动验收清单
