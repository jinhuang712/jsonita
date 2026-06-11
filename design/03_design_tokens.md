# 设计令牌

颜色 / 字体 / 间距 / 圆角 / 阴影 / 动效 ── 先讲设计语言与命名规则，再列 light + dark 取值表。

本章是 视觉契约：所有 UI 颜色 / 字号 / 间距必须经 token，不允许 hardcode 颜色或魔法值。组件如何使用 token 见 [04 组件库](04_components.md)；图标资源调色见 [05](05_icons_theme.md)。

## 一 · 设计

### 1 设计语言锚点

Jsonita 的视觉语言锚定在四点上，所有 token 取值都为之服务：

#### 要表达 · Express

极简克制 ── 不装饰，编辑器和数据是主角

macOS native 气质 ── SF Pro · 系统 blur · vibrancy 风

开发者审美 ── mono 字体多用 · 类型颜色清晰

瞬时清晰 ── 状态色不饱和但识别度高（红=错，绿=有效）

Native Quiet Glass 是当前实现方向：窗口保留 macOS 玻璃气质，但交互强调从鲜亮系统蓝收敛为蓝灰系低饱和提示。编辑器内容永远是视觉主角；TabBar、Search、Settings、History、权限弹窗、状态栏和快捷键提示都只能用弱背景、细边框、轻字重和短动效建立层级。

#### 避免 · Avoid

大色块 / 渐变背景 ── 浮窗保持极轻

多种品牌色 ── 蓝灰是唯一交互强调色；AI Fix 的琥珀只用于修复路径，不做 glow 或大面积彩色块

圆角 ≥ 16px 的"App"感 ── 文档卡片最多 10px

动效 > 200ms ── 工具应即时响应

### 2 命名规则

token 在 CSS variables 中以 `--kebab-case` 暴露；在 Tailwind 中以同名映射。 新加 token 必须遵守：

语义优先于具体值 ：用 `--danger` ，不用 `--red-500` ── 换色不动调用点

三档命名 = `base` / `-soft` / `-strong` （如 `--border` / `--border-strong` ）

状态色背景 统一加 `-bg` 后缀（ `--ok-bg` · `--danger-bg` ）

控件表面 统一用 `--control-*`（ `--control-bg` / `--control-bg-hover` / `--control-bg-active` / `--control-border` ）。按钮、输入框、搜索 chip、设置项、History action 和权限弹窗按钮不得各自发明背景色。

编辑器专属 以 `--editor-*` 前缀

JSON 高亮 以 `--json-*` 前缀

禁止 冗长前缀 `--color-*` / `--font-size-*` ── 语义本身已分类

### 3 token 域总览

| 域 | 前缀 | 下游章节 | 本章节段 |
| --- | --- | --- | --- |
| 颜色（品牌 / 中性 / 控件 / 状态 / JSON / Editor） | `--primary / --bg / --control-* / --ok / --json-* / --editor-*` | 04 组件 · 05 图标 · 08 编辑器 | § 4 |
| 字体 | `--font-* / --fs-* / --fw-* / --lh-*` | 04 组件 · 08 编辑器 | § 6 |
| 间距 | `--sp-*` | 04 组件 | § 7 |
| 圆角 / 边框 / 阴影 | `--radius-* / --bw-* / --shadow-*` | 04 组件 · 06 窗口 | § 8 |
| 动效 | `--dur-* / --ease-*` | 06 窗口 · 04 组件 | § 9 |
| Z-index | `--z-*` | 04 组件（Modal / Tooltip；Toast 为保留设计） | § 10 |

## 二 · 取值

### 4 颜色

#### 4.1 分类

| 组 | token | 用途 |
| --- | --- | --- |
| 品牌 | `--primary` | 主操作 / 链接 / 选中 / focus ring（低饱和蓝灰） |
| `--accent` | AI Fix / Diff Accept / inline code（琥珀） |  |
| 中性 | `--bg / --bg-card / --bg-code / --bg-overlay` | 页面 / 卡片 / 代码块 / Modal 遮罩 |
| 控件 | `--control-bg / --control-bg-hover / --control-bg-active / --control-border` | 按钮、输入框、搜索 chip、设置行、History action、权限弹窗按钮 |
| `--glass-bg / --glass-blur / --glass-border / --glass-highlight` | 浮窗原生玻璃叠色 / 文档 mockup 的 CSS 玻璃预览 |  |
| `--text / --text-muted / --text-faint` | 正文 / 弱化 / 几乎隐形（占位 / 元信息） |  |
| `--border / --border-strong` | 普通分隔 / 强调分隔 |  |
| 状态 | `--ok / --ok-bg` | valid JSON / 测试通过（绿系） |
| `--warn / --warn-bg` | 大文件警告 / 超时（低饱和暖色） |  |
| `--danger / --danger-bg` | parse 失败 / API 错误（红系） |  |
| `--info / --info-bg` | 信息提示 / Tree 类青色弱强调 |  |
| 操作类型 | `--op-format / --op-tree / --op-convert / --op-ai-fix` | History op-chip 四色区分 |

#### 4.2 品牌 + 中性取值（light / dark 双列）

| token | light | dark | 设计意图 |
| --- | --- | --- | --- |
| `--primary` | `#436F9F` | `#8AA3BE` | 低饱和蓝灰；active tab / 主按钮 / 选中 |
| `--primary-soft` | `rgba(67,111,159,.11)` | `rgba(138,163,190,.12)` | hover / active 背景，只作轻提示 |
| `--primary-edge` | `rgba(67,111,159,.24)` | `rgba(138,163,190,.24)` | hover / focus / active 细边框 |
| `--accent` | `#916334` | `#C49A6C` | AI Fix / Diff Accept / inline code；琥珀强调但不 glow |
| `--accent-soft` | `rgba(145,99,52,.12)` | `rgba(196,154,108,.13)` | AI Fix 背景叠色 |
| `--glass-bg` | `rgba(255,255,255,.62)` | `rgba(23,25,31,.72)` | 浮窗唯一主叠色；dark 下加深以避免灰幕感，仍保留原生 vibrancy |
| `--glass-blur` | `blur(42px) saturate(180%)` | `blur(42px) saturate(175%)` | 文档 mockup 模拟；真机由原生 vibrancy 负责 |
| `--chrome-bg` | `transparent` | `transparent` | TabBar / StatusBar 不再铺整条 band，只靠主窗 tint + 发丝线分层 |
| `--chrome-bg-strong` | `rgba(255,255,255,.16)` | `rgba(255,255,255,.07)` | hover / kbd / 局部 glass chip |
| `--control-bg / --control-bg-hover / --control-bg-active / --control-border` | `rgba(255,255,255,.24)` / `rgba(255,255,255,.34)` / `rgba(70,111,160,.12)` / `rgba(34,43,58,.12)` | `rgba(255,255,255,.045)` / `rgba(255,255,255,.075)` / `rgba(136,161,190,.13)` / `rgba(255,255,255,.115)` | 所有控件表面；避免各组件硬编码按钮色 |
| `--tab-active-bg / --tab-active-border` | `rgba(255,255,255,.2)` /`rgba(67,111,159,.18)` | `rgba(255,255,255,.09)` /`rgba(255,255,255,.14)` | active tab pill；只表达位置，不形成蓝色大块 |
| `--bg` | `rgba(255,255,255,0)` | `rgba(26,28,36,0)` | Tauri 透明窗口底 |
| `--bg-card` | `rgba(255,255,255,.62)` | `rgba(23,25,31,.68)` | 浮窗 / Modal / 卡片叠层 |
| `--bg-code` | `rgba(255,255,255,.46)` | `rgba(23,25,31,.5)` | code / pre 块；搜索条 dark 下也从该 token 派生 |
| `--bg-overlay` | `rgba(0,0,0,0.32)` | `rgba(0,0,0,0.56)` | Modal 遮罩；dark 更浓避免反白 |
| `--text` | `#20232A` | `#E7E9ED` | 正文 |
| `--text-muted` | `rgba(26,30,40,.54)` | `rgba(231,233,237,.57)` | 弱化（meta / placeholder） |
| `--text-faint` | `rgba(26,30,40,.36)` | `rgba(231,233,237,.36)` | 几乎隐形（占位 hint） |
| `--border` | `rgba(0,0,0,.07)` | `rgba(255,255,255,.1)` | 普通分隔线 |
| `--border-strong` | `rgba(0,0,0,.13)` | `rgba(255,255,255,.16)` | 强调分隔（如表头） |

#### 4.3 状态色取值

| token | light | dark | 说明 |
| --- | --- | --- | --- |
| `--ok` /`--ok-bg` | `#477E63` /`rgba(71,126,99,.12)` | `#8DBFA1` /`rgba(141,191,161,.13)` | 状态文字 / valid badge |
| `--warn` /`--warn-bg` | `#8C673A` /`rgba(140,103,58,.12)` | `#C7A172` /`rgba(199,161,114,.12)` | 大文件 / 超时 |
| `--danger` /`--danger-bg` | `#A35B56` /`rgba(163,91,86,.11)` | `#D69A96` /`rgba(214,154,150,.13)` | parse 错 / HTTP 错 |
| `--info` /`--info-bg` | `#4E7974` /`rgba(78,121,116,.12)` | `#8DB7B1` /`rgba(141,183,177,.13)` | callout / Tree 类信息 |

关键设计：dark 模式下，状态色背景统一用 透明度叠加 （14%）而不是实色 ── 避免大片饱和色块在深色背景上视觉刺眼。

#### 4.4 JSON 语法高亮 + 编辑器专属

| token | light | dark | 用途 |
| --- | --- | --- | --- |
| `--json-key` | `#4E7FAE` | `#9AB6D0` | 蓝灰 key 视觉锚 |
| `--json-string` | `#548365` | `#91C09B` | 低饱和绿系字符串 |
| `--json-number` | `#9A7043` | `#D0A879` | 低饱和暖色数字 |
| `--json-bool` | `#7668A4` | `#B8ACD3` | 柔和紫色 bool，区分 number |
| `--json-null` | `rgba(20,22,30,.36)` | `rgba(255,255,255,.36)` | 同 text-faint |
| `--json-punc` | `rgba(20,22,30,.4)` | `rgba(255,255,255,.42)` | 标点（淡化） |
| `--editor-bg` | `transparent` | `transparent` | 编辑器透明，避免覆盖主窗原生玻璃 |
| `--editor-gutter` | `transparent` | `transparent` | 行号槽不再形成整块暗带 |
| `--editor-line-active` | `rgba(67,111,159,.035)` | `rgba(138,163,190,.04)` | 当前行高亮；只作定位，不能形成整条蓝带 |
| `--editor-selection` | `rgba(67,111,159,.2)` | `rgba(138,163,190,.2)` | 选区 |
| `--editor-cursor` | `#436F9F` | `#A7BDD4` | 光标 |
| `--editor-error-underline` | `#A35B56` | `#D69A96` | parse error 下划线 |
| `--editor-bracket-match` | `rgba(67,111,159,.15)` | `rgba(138,163,190,.17)` | 括号匹配 |
| `--editor-indent-guide` | `rgba(0,0,0,.07)` | `rgba(255,255,255,.1)` | 缩进引导线 |

#### 4.5 History op-chip 四色

| token | light | dark | 用途 |
| --- | --- | --- | --- |
| `--op-format / --op-format-bg` | `#4E7FAE` /`rgba(78,127,174,.11)` | `#9AB6D0` /`rgba(154,182,208,.12)` | format / minify |
| `--op-tree / --op-tree-bg` | `#4E7974` /`rgba(78,121,116,.12)` | `#8DB7B1` /`rgba(141,183,177,.13)` | tree |
| `--op-convert / --op-convert-bg` | `#548365` /`rgba(84,131,101,.12)` | `#91C09B` /`rgba(145,192,155,.13)` | →str / →json |
| `--op-ai-fix / --op-ai-fix-bg` | `#916334` /`rgba(145,99,52,.12)` | `#C49A6C` /`rgba(196,154,108,.13)` | AI Fix |

### 5 对比度核验（WCAG）

| 组合 | light 比 | dark 比 | WCAG |
| --- | --- | --- | --- |
| text on bg | 14.5 : 1 | 11.2 : 1 | AAA |
| text on bg-card | 15.8 : 1 | 11.9 : 1 | AAA |
| text-muted on bg | 5.7 : 1 | 5.9 : 1 | AA |
| primary on bg-card | 4.8 : 1 | 5.2 : 1 | AA |
| danger on bg-card | 5.9 : 1 | 5.3 : 1 | AA |
| json-string on editor-bg | 5.4 : 1 | 6.1 : 1 | AA |

OK

所有正文文本组合 ≥ AA（4.5 : 1）；body text 达 AAA（7 : 1）。无障碍达标。

### 6 字体

#### 6.1 字体栈

不打包字体文件，全用系统字体。原因：SF Pro 是 macOS 系统字体质感最对；打包字体会让 dmg 体积超过 15 MB 红线（ [04 NFR § 1](../plan/04_nfr.md) ）。

| token | 优先级（左 → 右） |
| --- | --- |
| `--font-sans` | -apple-system → BlinkMacSystemFont → "SF Pro Display"（mac）→ "Segoe UI"（Win）→ "PingFang SC"（中文 mac）→ "Microsoft YaHei UI"（中文 Win）→ Helvetica → Arial → sans-serif |
| `--font-mono` | "SF Mono"（mac）→ "JetBrains Mono"（已装）→ "Cascadia Code"（Win Terminal 默认）→ Menlo → Consolas → "Liberation Mono" → monospace |

#### 6.2 字号 scale（4 档 + 编辑器独立）

| token | px | 用途 |
| --- | --- | --- |
| `--fs-xs` | 11 | tag / breadcrumb / meta |
| `--fs-sm` | 12.5 | 表格 td / 状态栏；Toast 为保留设计 |
| `--fs-base` | 13.5 | UI 默认（按钮 / 输入框 / 列表） |
| `--fs-md` | 14 | 设置面板正文 / Modal body |
| `--fs-lg` | 16 | Modal 标题 / Tab 文字 |
| `--fs-xl` | 20 | 设置面板分组标题 |
| `--fs-2xl` | 26 | 预留（v1 未用） |
| `--fs-editor` | 13 | CodeMirror 主编辑器（独立调） |
| `--fs-tree` | 12 | JSON 树视图 |

浮窗缩放域： `--fs-editor` 是 `⌘+` /`⌘-` /`⌘0` 的源值；浮窗根节点用它派生 `--fs-tree`、 `--fs-xs`、 `--fs-sm`。CodeMirror 正文、line number gutter、Tree 完整跟随编辑器字号；顶部 TabBar、SinglePaneHint、StatusBar 的紧凑文字只轻微跟随并封顶（ `--fs-xs` ≤ 12.5px， `--fs-sm` ≤ 14px），避免 chrome 喧宾夺主。SettingsView 作为主壳内页面沿用浮窗 token；History Modal 等独立 modal 仍使用全局 token，不跟随编辑器字号。

#### 6.3 字重 + 行高

| 类别 | token | 值 | 用途 |
| --- | --- | --- | --- |
| 字重 | `--fw-regular` | 400 | 正文 |
| `--fw-medium` | 500 | UI 标签 / 按钮 |  |
| `--fw-semibold` | 600 | 标题 / 强调 |  |
| `--fw-bold` | 700 | 顶层标题 / 链接 hover |  |
| 行高 | `--lh-tight` | 1.25 | 标题 / 紧凑 TabBar |
| `--lh-snug` | 1.4 | UI / 状态栏 |  |
| `--lh-normal` | 1.6 | 正文 |  |
| `--lh-loose` | 1.75 | Markdown 渲染 |  |
| `--lh-code` | 1.55 | 编辑器正文 + line number gutter + tree |  |

### 7 间距 scale（8 档 / 4 px 节奏）

| token | px | 典型场景 |
| --- | --- | --- |
| `--sp-0` | 0 | — |
| `--sp-1` | 4 | 图标 + 文本 gap |
| `--sp-2` | 8 | 按钮内边距 vertical / list item |
| `--sp-3` | 12 | 按钮 horizontal / 表格 td |
| `--sp-4` | 16 | 卡片 padding / Modal 内边距 v |
| `--sp-5` | 20 | section 之间 / Modal 内边距 h |
| `--sp-6` | 24 | h2 上下间距 |
| `--sp-8` | 32 | doc-article 边距 |
| `--sp-10` | 40 | 大段落分隔 |

### 8 圆角 / 边框 / 阴影

| 类别 | token | 值 | 用途 |
| --- | --- | --- | --- |
| 圆角 | `--radius-sm` | 4 px | tag / code / kbd |
| `--radius-md` | 6 px | 按钮 / 输入框 / toast |  |
| `--radius-lg` | 8 px | 卡片 / callout / 表格容器 |  |
| `--radius-xl` | 10 px | 浮窗主容器 / mockup-window |  |
| `--radius-2xl` | 14 px | Modal |  |
| `--radius-full` | 9999 px | pill / 头像 |  |
| 边框 | `--bw-1` | 1 px | 默认 |
| `--bw-2` | 2 px | focus ring inner |  |
| `--bw-3` | 3 px | h2 左竖条 |  |
| 阴影 light | `--shadow-sm` | `0 1px 2px rgba(31,35,41,0.04)` | 卡片 / mockup 轻微分层 |
| `--shadow-md` | `0 8px 24px rgba(31,35,41,0.08)` | dropdown / select |  |
| `--shadow-lg` | `0 16px 40px rgba(31,35,41,0.12)` | 浮窗 / Modal |  |
| `--shadow-focus` | `0 0 0 3px rgba(36,91,219,0.18)` | focus ring（primary 18%） |  |
| 阴影 dark | `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.28)` | 低对比阴影 |
| `--shadow-md` | `0 8px 24px rgba(0,0,0,0.32)` | 低对比阴影 |  |
| `--shadow-lg` | `0 16px 40px rgba(0,0,0,0.40)` | 浮层，不额外加亮边 |  |
| `--shadow-focus` | `0 0 0 3px rgba(138,173,255,0.28)` | primary dark 提亮版 |  |

dark 阴影特殊处理：浮层主要靠边框与背景层级区分，阴影只做弱分层；不额外叠亮边，避免深色界面显得装饰化。

### 9 动效

动效基线来自 `design/jsonita-motion-demo.md`，已沉淀为下列 token 与动画清单。设计稿中的 Material / spring / instant 只作为评审对照；真实实现默认使用偏 macOS 的 `--ease-native`，并尊重 reduced motion。

#### 9.1 时长 + 缓动

| 类别 | token | 值 | 场景 |
| --- | --- | --- | --- |
| 时长 | `--dur-instant` | 80 ms | hover 色变化 |
| `--dur-fast` | 120 ms | 按钮 active |  |
| `--dur-base` | 150 ms | 浮窗淡入 |  |
| `--dur-slow` | 200 ms | 浮窗淡出 / Modal 出场 |  |
| `--dur-toast` | 5000 ms | 保留 token；当前未接入 Toast |  |
| 缓动 | `--ease-standard` | `cubic-bezier(0.4, 0.0, 0.2, 1)` | Material 风（默认） |
| `--ease-out` | `cubic-bezier(0.0, 0.0, 0.2, 1)` | 入场 |  |
| `--ease-in` | `cubic-bezier(0.4, 0.0, 1, 1)` | 出场 |  |
| `--ease-native` | `cubic-bezier(0.32, 0.72, 0, 1)` | 玻璃方向主力缓动；阶段 2 已用于状态栏快捷键、浮窗呼出、Tab active pill、AI Fix 入场、主题手动切换。可选 `--ease-spring` 走 CSS `linear()` |  |


遵循 `@media (prefers-reduced-motion: reduce)`：所有 `animation-duration` 降为 1 ms（实际禁用）。

#### 9.2 关键动画清单

| 动画 | 触发 | 变换 | 时长 / 缓动 |
| --- | --- | --- | --- |
| `jsonita-window-summon` | 浮窗 show | opacity 0→1 + translateY -6px→0 + scale .96→1 | `--dur-base` /`--ease-native` |
| `jsonita-window-dismiss` | 浮窗 hide | opacity 1→0 + translateY 0→-4px + scale 1→.99 | 140 ms /`--ease-in` |
| `jsonita-pane-in` | Tab / 单双栏内容切换 | 内容 cross-fade | `--dur-fast` /`--ease-native` |
| `jsonita-ai-fix-enter` + glow | AI Fix 入口出现 | translateX 10px→0 + opacity + 一次性琥珀微光 | `--dur-base` /`--ease-native`；glow 不循环 |
| `jsonita-theme-transition` | 手动切换主题 | bg / color / border / shadow 交叉淡 | ~180 ms /`--ease-native`；初次加载与 system 自动变化不触发 |
| `toast-in` | 保留动画 | opacity 0→1 + translateY 8px→0 | `--dur-base` /`--ease-out` |
| `fade-out` | 保留动画 | opacity 1→0 | `--dur-slow` |


玻璃方向动画（阶段 2 已实现 →[design/HANDOFF.md](HANDOFF.md) § 4）：主力缓动为 `--ease-native`。浮窗呼出 scale 起点为 `0.96`、出场比入场更快（140 ms）；Tab active 药丸滑动使用 left / width + `--ease-native`；切 Tab / 单窗为 即时布局切换 （不 remount 面板、不淡入 —— remount 会拆掉 CodeMirror、丢输入光标、手感 clunky）；AI Fix 从右滑入 + 一次性琥珀微光（ 不循环 ）；主题切换仅在手动切换时对全局色做约 180 ms 交叉淡，初次加载与 system 自动变化不触发以防 FOUC。 硬约束：绝不动 `backdrop-filter` / blur 半径（合成层卡顿），只动 transform / opacity / 颜色类属性。

#### 9.3 设计稿到 token 的承接

| 设计稿 | 沉淀内容 | 权威位置 |
| --- | --- | --- |
| `jsonita-design-explorations.md` | 选定原生玻璃 / vibrancy 方向，淘汰其他风格分支 | 本章 § 1、§ 4 |
| `jsonita-glass-hero-light-dark.md` | 主窗单层玻璃 tint、系统蓝作为唯一主交互色、valid 绿状态 | § 4.2、§ 4.3 |
| `jsonita-glass-mockups.md` | AI Fix 琥珀强调、History op-chip 四色、Toast 4 variant reserved、SVG 描边图标方向 | § 4.3、§ 4.5、04 § 4.3、05 图标章节 |
| `jsonita-motion-demo.md` | 150ms summon、140ms dismiss、180ms theme fade、native easing、禁动 blur | § 9.1、§ 9.2 |
| `jsonita-singlepane-statusbar-demo.md` | 状态栏右侧 hover/focus 才滑出快捷键，单双栏切换不改窗口尺寸 | 01 § 2、04 § 4.2 |
| `jsonita-settings-detail.md` | 设置分组、checkbox 视觉、API key 行内反馈、About 路径展示 | 01 § 4、04 § 4.6-4.8、[A00 schemas](../spec/appendix/A00-schemas.md) |

### 10 Z-index scale

| token | 值 | 用途 |
| --- | --- | --- |
| `--z-base` | 0 | 默认 |
| `--z-elevated` | 10 | 卡片 hover |
| `--z-sticky` | 20 | 状态栏 |
| `--z-dropdown` | 30 | select / autocomplete |
| `--z-modal-bg` | 40 | Modal 遮罩 |
| `--z-modal` | 50 | Modal 容器 |
| `--z-toast` | 60 | 保留 token；当前未接入 Toast |
| `--z-tooltip` | 70 | Tooltip（最顶） |

## 三 · 主题切换机制

### 11 主题切换流程

设置项 `settings.theme: 'system' | 'light' | 'dark'` （默认 `'system'` ）。 effective theme 的权威解析在原生： `window_set_theme(mode)` IPC 读 `NSApp.effectiveAppearance` 回传 `'light' | 'dark'`。webview 的 `matchMedia` 不参与取值，仅在 `system` 模式下作 OS 主题切换的 re-trigger ── 因为 `NSWindow.appearance` 被 pin 成具体值后会污染 webview 的 `prefers-color-scheme` （旧 bug：light→system 不变 dark，见 [06 § 2.6](06_window.md) ）。

主题切换数据流：

| 来源 | 动作 | 结果 |
| --- | --- | --- |
| `settings.theme` | 传入 `system` / `light` / `dark` mode | 触发 `window_set_theme(mode)` IPC |
| 原生 `NSApp.effectiveAppearance` | `system` 模式时解析真实 OS 主题 | 回传 effective `light` 或 `dark` |
| `settings:changed` event | 用户改设置后通知前端 | 重新 resolve 并 apply theme |
| `matchMedia` change | `system` 模式下 OS 切换 re-trigger | 重新调 IPC，由原生重新解析 |
| `document.documentElement.dataset.theme` | 设置 `light` 或 `dark` | CSS variables 自动切换 |
| `editorStore.setTheme` | 同步 CodeMirror theme extension | 编辑器主题与 UI theme 对齐 |
| `localStorage["jsonita.theme.effective"]` | 缓存 effective theme | `src/index.html` inline script 可在 React 挂载前提前设 `data-theme`，避免 FOUC |

#### 11.1 核心实现要点

原生权威解析 ： `settings.theme` 变化时调 `window_set_theme(mode)` ，原生按 mode 解析 ── `system` 读 `NSApp.effectiveAppearance` （真实 OS 主题），回传 effective theme（light / dark）。前端 不再 用 webview `matchMedia` 取值（会被 NSWindow.appearance pin 污染）

挂 data-theme ：所有 CSS 变量切换由 `[data-theme="dark"] { ... }` 覆盖触发 ── 无 JS 计算颜色

CodeMirror 单独通知 ：编辑器有自己的 theme extension（不读 CSS variables），需 `editorStore.setTheme()` 同步

原生 vibrancy 同步 + 跟随 OS ：同一 IPC 让原生 `NSVisualEffectView` 材质 + NSWindow appearance 跟随主题（否则 dark 发灰）； `system` 模式把 appearance 设 `nil` 跟随 OS，使运行时系统主题切换能推送给 webview（见 [06 § 2.6](06_window.md) ）

双重订阅 ：matchMedia change（ `system` 模式下 OS 切换的 re-trigger，触发重新调 IPC）+ settings:changed（用户改设置）

避免 FOUC ：PROJECT.md `<head>` 内联一段 script 先于 React bundle 读 localStorage cache 设 `data-theme`

#### 11.2 resolve + apply 核心 ~18 行

```
// src/theme/useEffectiveTheme.ts
// 权威：原生 win.setTheme(mode) 读 NSApp.effectiveAppearance 回传 light|dark。
// 非 Tauri（浏览器 dev）退回 matchMedia（此时无 NSWindow.appearance pin，可靠）。
const resolve = async (): Promise<'light' | 'dark'> => {
  try { return await win.setTheme(theme); }          // theme = mode
  catch {
    if (theme !== 'system') return theme;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
};

useEffect(() => {
  const apply = async () => {
    const eff = await resolve();
    document.documentElement.dataset.theme = eff;
    editorStore.setTheme(eff);
    localStorage.setItem('jsonita.theme.effective', eff);
  };
  void apply();
  if (theme === 'system') {                          // OS 切换 re-trigger
    const mql = matchMedia('(prefers-color-scheme: dark)');
    mql.addEventListener('change', apply);
    return () => mql.removeEventListener('change', apply);
  }
}, [theme]);
```

#### 11.3 FOUC 避免（inline script ~7 行）

```
<!-- PROJECT.md <head>，先于主 bundle -->
<script>
(function() {
  try {
    var t = localStorage.getItem('jsonita.theme.effective') || 'light';
    document.documentElement.dataset.theme = t;
  } catch (e) {}
})();
</script>
```

## 四 · Tailwind 集成

### 12 Tailwind 映射规则

用 Tailwind 是为了"快写 utility"，但 颜色 / 间距 / 字号 都引用 CSS variables， 不 用 Tailwind 默认色板。

| Tailwind theme key | 映射到 | 用法示例 |
| --- | --- | --- |
| `colors.primary / .bg / .text / .ok / ...` | 对应 `--*` CSS variables | `bg-primary text-text-muted` |
| `fontFamily.sans / .mono` | `var(--font-sans / --font-mono)` | `font-mono` |
| `fontSize.xs / sm / base / md / lg / xl` | 映射到 `--fs-*` + 对应 `--lh-*` | `text-sm` |
| `spacing.1 / 2 / ... / 10` | 显式 px 表（4/8/12/16/20/24/32/40）， 不 用 Tailwind 默认 rem | `p-3 gap-2` |
| `borderRadius.sm / md / lg / xl / 2xl` | `var(--radius-*)` | `rounded-md` |
| `boxShadow.sm / md / lg / focus` | `var(--shadow-*)` | `shadow-lg` |
| `transitionDuration / TimingFunction` | `var(--dur-* / --ease-*)` | `duration-base ease-out` |
| `darkMode` | `['selector', '[data-theme="dark"]']` | `dark:bg-bg-card` |

#### 12.1 config 骨架（~20 行核心）

```
// tailwind.config.ts ── 关键 extend；完整文件含全部 12 个 token 域
export default {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx,html}', './PROJECT.md'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)', accent: 'var(--accent)',
        bg: 'var(--bg)', 'bg-card': 'var(--bg-card)',
        text: 'var(--text)', 'text-muted': 'var(--text-muted)',
        border: 'var(--border)',
        ok: 'var(--ok)', warn: 'var(--warn)',
        danger: 'var(--danger)', info: 'var(--info)',
      },
      fontFamily: { sans: 'var(--font-sans)', mono: 'var(--font-mono)' },
      borderRadius: { md: 'var(--radius-md)', lg: 'var(--radius-lg)', xl: 'var(--radius-xl)' },
      boxShadow: { lg: 'var(--shadow-lg)', focus: 'var(--shadow-focus)' },
    },
  },
} satisfies Config;
```

## 五 · 预览

### 13 同一组件 light vs dark

#### 13.1 状态栏（合法 / 错误）

light · valid

● Valid JSON · 5 lines · 76 bytes History (12) · Settings

/

dark · valid

● Valid JSON · 5 lines · 76 bytes History (12) · Settings

#### 13.2 错误状态

light · parse error

● Invalid JSON

/

dark · parse error

● Invalid JSON

#### 13.3 JSON 树 ── 类型颜色

light tree

▾ root {3}

name: "alice"

age: 30

active: true

extra: null

/

dark tree

▾ root {3}

name: "alice"

age: 30

active: true

extra: null
