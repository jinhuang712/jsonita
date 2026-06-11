# Jsonita 视觉重设计 · HANDOFF

> 这份文档是一次 UI 视觉重设计探索的交接说明，写给之后执行实现的 agent 或人看。
> 当前文档体系以 Markdown 为最终来源。入口顺序：`WORKFLOW.md` → `design/README.md` → 本文件 → 相关 `design/*.md`。

---

## 0 . 一句话结论

把 Jsonita 的视觉从现有 flat 风格,重做成**原生玻璃(macOS vibrancy)**方向:半透磨砂窗体、**系统蓝**作唯一交互强调色、绿色表示 valid、操作类型用**四色 op-chip** 区分;并新增**单窗模式快捷键 `⌘\` + 状态栏切换控件**,配一套**偏 macOS 手感的动画**。

方向是用户在 3 个候选(石墨极简 / 暖调编辑 / 原生玻璃)里**选定玻璃**,并已逐屏确认 + 细化。

---

## 1 . design/ 文件指南

| 文件 | 是什么 | 看什么 |
|---|---|---|
| `jsonita-design-explorations.md` | 最初 3 个方向对比(石墨 / 暖调 / 玻璃) | 为什么选玻璃(历史背景) |
| `jsonita-glass-hero-light-dark.md` | 玻璃 hero 精修 · light+dark | 玻璃材质 / 系统蓝 / 语法色基调 |
| `jsonita-glass-mockups.md` | **玻璃全屏 mockup(主参考)** | 6 态主窗 + AI Fix Diff + 设置 + 历史 + 权限 + 状态栏4态 + 菜单栏 + 空状态 + Toast,均 light+dark |
| `jsonita-settings-detail.md` | 设置 6 面板详版(交互,可点 nav 切换) | 每个面板真实字段 + 控件形态 |
| `jsonita-motion-demo.md` | 动画交互 demo | 缓动对比(原生/Material/轻弹/即时)、呼出/隐藏/tab/AI Fix/缩放/主题 的脚感 |
| `jsonita-singlepane-statusbar-demo.md` | **单窗切换 + 状态栏 hover 场景(最终版 v2)** | Switch 控件 + hover 浮现快捷键 + 双栏↔单栏动画 + 顺势缩窄 |

> 注意：这些设计 Markdown 里保留的 prototype source 使用纯 CSS `backdrop-filter` 模拟玻璃，仅作视觉参考。真机玻璃要走原生 vibrancy(见 §5 阶段 3)。

---

## 2 . 选定方向 · 玻璃材质参数

| 维度 | light | dark |
|---|---|---|
| 窗体底 | `rgba(255,255,255,.62)` | `rgba(26,28,36,.55)` |
| 模糊 | `blur(42px) saturate(180%)` | `blur(42px) saturate(175%)` |
| 边框 | `1px rgba(0,0,0,.07)` | `1px rgba(255,255,255,.16)` |
| 顶部内高光 | `inset 0 1px 0 rgba(255,255,255,.85)` | `inset 0 1px 0 rgba(255,255,255,.22)` |
| 投影 | `0 28px 64px -20px rgba(40,40,90,.28)` | `0 28px 64px -20px rgba(0,0,0,.6)` |
| 圆角 | 窗 14–16px · 控件 7–8px | 同 |
| 正文 / 次要文字 | `#1D1F26` / `rgba(20,22,30,.5)` | `#EEF0F4` / `rgba(255,255,255,.55)` |
| 发丝分隔线 | `rgba(0,0,0,.07)` | `rgba(255,255,255,.1)` |

---

## 3 . 调色板(系统蓝唯一强调 + 绿 valid)

| token | light | dark | 用途 |
|---|---|---|---|
| accent 系统蓝 | `#0A6CE0` | `#0A84FF`(active 文字提亮 `#7FB3FF`) | active tab / 主按钮 / 选中 |
| valid 绿 | `#1F9E5A` | `#5BE3A0` | 状态点 |
| danger | `#C0392B` | `#F2A0A0` | parse 错 |
| syntax · key | `#0B66C2` | `#82C0FF` | |
| syntax · string | `#2E7D4F` | `#84E08F` | |
| syntax · number | `#B5651D` | `#FFB66B` | |
| syntax · bool | `#7A4FC0` | `#C9B0FF` | |
| syntax · punc | `rgba(20,22,30,.4)` | `rgba(255,255,255,.42)` | |

**op-chip(历史 / 操作类型,四色区分 —— 修上轮"塌成一片蓝"的问题):**

| op | light 底/字 | dark 底/字 |
|---|---|---|
| format / minify(蓝) | `rgba(10,108,224,.12)` / `#0A6CE0` | `rgba(10,132,255,.2)` / `#7FB3FF` |
| tree(青) | `rgba(13,148,136,.12)` / `#0D7E72` | `rgba(45,212,191,.2)` / `#5FE3C8` |
| →str / →json(绿) | `rgba(31,158,90,.12)` / `#1F8A50` | `rgba(91,227,160,.2)` / `#5BE3A0` |
| ai-fix(琥珀) | `rgba(181,101,29,.13)` / `#A4621A` | `rgba(255,182,107,.2)` / `#FFC58A` |

**AI Fix 标签 / DiffView Accept = 琥珀强调**(`--accent` 暖橙系),不是蓝 —— 让"出错→修复"路径有视觉重量。dark `rgba(255,182,107,.16)`/`#FFC58A`,light `rgba(181,101,29,.13)`/`#A4621A`。

---

## 4 . 动画规范

**缓动(新增,替 Material 网页味):**

- `--ease-native: cubic-bezier(0.32, 0.72, 0, 1)` —— 主力,呼出 / 缩放 / modal / tab 都用它,脚感更脆更"macOS"。
- `--ease-spring`(可选,真弹簧):`linear(0,0.494 7.5%,0.892 15%,1.08 22.5%,1.103 26%,1.06 32%,0.998 41%,0.984,1)`(Tauri WebKit 支持 `linear()`)。
- 现有时长保留:instant 80 / fast 120 / base 150 / slow 200 ms;resize 200–240ms;theme 交叉淡 ~180ms。

**动画清单:**

| 动画 | 变换 | 时长 / 缓动 |
|---|---|---|
| 呼出 summon | opacity 0→1 + scale .96→1 + translateY -6→0,`transform-origin` 近光标锚点 | 150ms / ease-native |
| 隐藏 dismiss | opacity 1→0 + scale→.99 + translateY→-4(**比入场快**) | 140ms / ease-in |
| Tab 切换 | active 药丸滑动(left/width) + 面板内容 cross-fade | 180ms pill / ≤120ms 内容 |
| AI Fix 出现 | 从右 translateX 10→0 + opacity;落定一次性琥珀微光 | 150ms;glow 一次**不循环** |
| 单窗切换 | body grid `1fr 1fr`↔`1fr 0fr` + 窗口宽 560→440 顺势缩窄 + Output 淡出 + Run hint 滑入 | 240ms / ease-native |
| 主题切换 | 全局 bg/color/border 交叉淡,**仅手动切触发**(初次加载不触发,防 FOUC) | ~180ms |

**硬约束:**
- **绝不动 `backdrop-filter` / blur 半径**(合成层上极卡)——只动 `transform` / `opacity`。
- `prefers-reduced-motion: reduce` 已实现(全部 →1ms);玻璃窗在该模式下直接 opacity 出现、**不缩放**。对应 macOS「减弱动态效果」,必须尊重。
- 现状:[`spec/01_runtime_lifecycle.md`](../spec/01_runtime_lifecycle.md) 明说浮窗 show/hide 过渡类**前端尚未接**,token 是保留设计 —— 实现时才真正接上。

---

## 5 . 新交互 · 单窗模式快捷键 + 状态栏

**最终决定(见 `jsonita-singlepane-statusbar-demo.md` v2):**

- 状态栏右侧两个控件**对称**:平时只有文字,**hover / 键盘聚焦才滑出快捷键**(`max-width`+`opacity`+`translateX`,~150ms ease-native)。
  - `Switch to Single Panel` / `Switch to Split Panel` —— **纯文字、无图标**;文案是"动作 + 目标态";点击或按 `⌘\` 切换。
  - `History` —— 文字;hover 浮现 `⌘Y`。
- **快捷键 `⌘\`(`CmdOrCtrl+\`)**:默认内置,但进设置「可自定义」组(与 `⌘⇧J` / `⌘⇧L` 并列)。
- **切到单窗顺势把窗口缩窄**(单窗内容少;前提是 `smartWidth` 开)。
- **去冗余**:单窗下左侧状态栏**不再**显示 "single-pane"(和右侧控件文字重复)。

---

## 6 . 上一轮设计评审的遗留问题(实现时一并修)

1. **token 三/四方打架已关闭**:旧文档站 CSS 曾与 `src/styles/tokens.css` 调色不一致；当前文档已迁为 Markdown，旧文档站样式文件已删除，后续只维护 `src/styles/tokens.css` 与 `design/03_design_tokens.md`。
2. AI Fix 在旧 mockup 渲染成蓝/灰,应是**琥珀**(见 §3)。
3. History op-chip 旧 dark 塌成一片蓝,应**四色**(见 §3)。
4. 图标全部 **SVG 描边**,去掉 emoji(`📋` / `⚙`)。
5. 设置面板去掉 reserved 行(初始宽度 / 重置浮窗尺寸),只留生效项。

---

## 7 . 实现阶段(锁定顺序 1→2→3,详见 TODO.md)

**阶段 1 · 单窗功能(低风险,纯前端 + settings)**
- `src/store/settings.ts` + Rust Settings（见 [`spec/appendix/schemas.md`](../spec/appendix/schemas.md)）新增 `shortcutSplitToggle`,默认 `CmdOrCtrl+\`。
- 全局 hotkey 注册 + 与「可自定义」快捷键体系打通（见 [`spec/03_ipc_boundary.md`](../spec/03_ipc_boundary.md) 与 [`spec/appendix/ipc-api.md`](../spec/appendix/ipc-api.md)）。
- `SettingsModal` Shortcuts 面板加这条可自定义项。
- StatusBar:加 `Switch to [Single/Split] Panel` 控件(hover 浮现 `⌘\`),History 改为 hover 浮现 `⌘Y`;切单窗触发 smart resize 缩窄;去掉左侧 "single-pane"。

**阶段 2 · 动画**
- `src/styles/tokens.css` 加 `--ease-native`(+可选 spring)。
- 接上 summon/dismiss 过渡类;tab pill 滑动;AI Fix entrance;主题交叉淡;守 reduced-motion;**不动 blur**。

**阶段 3 · 玻璃重绘(大,需原生,要 build 验证)**
- Tauri:`tauri.conf.json` 窗口 `transparent: true` + macOS `NSVisualEffectView` vibrancy（见 [`spec/01_runtime_lifecycle.md`](../spec/01_runtime_lifecycle.md) 与 [`spec/appendix/packaging-config.md`](../spec/appendix/packaging-details.md)）。
- `src/styles/tokens.css` 切玻璃调色板(§2/§3),light + dark `[data-theme="dark"]`;同步 `design/03_design_tokens.md`。
- 维护 [design/01_mockups.md](01_mockups.md) 的玻璃视觉权威，并在实现变化后同步更新。
- `cargo build` / `tauri dev` 验收磨砂效果 + 手动验收清单(本文件不跑 build)。

---

## 8 . 权威与边界(避免新 session 混淆)

- `design/` = UI、视觉、交互、原型、设计 token、图标、窗口、菜单栏、编辑器、i18n 和 a11y 的唯一目录。
- [design/01_mockups.md](01_mockups.md) = 当前视觉权威。
- 真玻璃 ≠ 改 CSS 颜色:必须原生窗口透明 + vibrancy,否则纯 `backdrop-filter` 没有桌面在后面不出磨砂。
- 一切按根 [WORKFLOW.md](../WORKFLOW.md) 执行。
