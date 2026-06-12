# 组件库映射

shadcn/ui 复用 + 自定义组件清单 + props 契约。所有视觉效果（颜色 / 布局 / 状态截图）见 [01 mockups](../design/01_mockups.md)；颜色 token 见 [03 design tokens](03_design_tokens.md)。

本章是 组件契约 （props / 状态 / 关键交互规则）；视觉权威在 [01 mockups](../design/01_mockups.md)；颜色 / 间距 / 圆角 / 阴影 token 权威在 [03 design tokens](03_design_tokens.md)。本章不重复绘制视觉、不重复列举颜色 token。

## 1 策略

shadcn/ui 是源码不是依赖 ── 按需 `npx shadcn@latest add <component>` 拷贝到 `src/ui/<name>.tsx` ，再改样式让它指向我们的 [02 设计令牌](03_design_tokens.md) token

基元用 shadcn （Button / Input / Select / Switch / Dialog / Tooltip / DropdownMenu / Tabs / ScrollArea）

业务组件自写 （Editor / TreeView / TabBar / StatusBar / SettingsView 等；Toast / HistoryModal 为保留设计）

不引 antd / Mantine / Chakra ── bundle 太大且风格冲突

## 2 shadcn/ui 复用清单

| 组件 | 来源 | 用途 | 覆写要点 |
| --- | --- | --- | --- |
| `Button` | shadcn | 设置 / Modal 内按钮 | default/ghost 都从 `--control-bg` / `--control-bg-active` 派生；不使用实心高饱和 primary |
| `Input` | shadcn | 设置 / API key 输入 | background `--control-bg` · border `--control-border` · focus ring `--shadow-focus` |
| `Label` | shadcn | 表单项标签 | color `--text-muted` · fs `--fs-sm` |
| `Select` | shadcn | 主题 / 缩进 / 历史上限选择 | 下拉浮层 bg `--bg-card` · 阴影 `--shadow-lg` |
| `Switch / Checkbox` | shadcn / custom | 设置面板所有 boolean 项 | checked 态用 `--control-bg-active` + `--primary-edge`，不使用整块实心蓝；自定义 checkbox 保留原生 input 可访问性 |
| `Tabs` | shadcn | 设置面板分组（General / Shortcuts / AI / ...） | border-bottom + active underline 样式 |
| `Dialog` | shadcn (Radix) | 历史 / 权限 / AI 错误 modal | 遮罩 `--bg-overlay` · 容器 `--bg-elevated` + `--glass-border` · 按钮走 `--control-*` |
| `DropdownMenu` | shadcn | 历史项右键菜单 / Tray 替代菜单 | 同 Select |
| `Tooltip` | shadcn | 按钮 / 状态栏 hover 提示 | bg dark always · z `--z-tooltip` |
| `ScrollArea` | shadcn | 历史列表 / 设置面板滚动 | thumb color `--border-strong` |
| `Toaster` | sonner（shadcn 推荐） | 保留设计；当前代码未接入 | 未来接入时 position bottom-right · 自定义 4 variants |
| `Separator` | shadcn | Modal / Dropdown 分隔线 | color `--border` |

### 2.1 shadcn 覆写规则

每个 shadcn 组件拷过来后立刻把默认 Tailwind class 替换为 过 token 的语义类 （如 `bg-primary` /`text-text-muted` ）。规则：

所有颜色经 token ：禁止出现 `bg-blue-500` / `text-gray-700` 等 Tailwind 调色板原始类

所有尺寸经 token ：圆角 `rounded-md` （= `--radius-md` ）/ 间距 `p-3` / 字号 `text-sm` ，禁止 `rounded-[6px]` 这种魔法值

focus-visible 而非 focus ：避免鼠标点击也出现 focus ring

variants 用 cva ：每个组件至少有 `variant: default/outline/ghost/danger` 与 `size: sm/md/lg` 两组维度

详见 `src/ui/*.tsx`，约定与 shadcn 上游对齐。

## 3 自定义组件清单

| 组件 | 文件 | 用途 |
| --- | --- | --- |
| `FloatingWindow` | shell/FloatingWindow.tsx | 浮窗壳 ── 路由当前 pane / 监听 IPC events |
| `TabBar` | shell/TabBar.tsx | 顶部功能 Tab + 右上设置按钮（含 AI Fix 仅错误时） |
| `StatusBar` | shell/StatusBar.tsx | 底部状态栏（valid / error · lines · bytes · History） |
| `Toast` | reserved | 未来封装 sonner；当前错误通过状态栏 / AI 面板 / 设置弹窗呈现 |
| `Editor` | editor/Editor.tsx | CodeMirror 6 包装（见 [07](08_editor.md) ） |
| `EditorSearchPanel` | editor/searchPanel.ts | `⌘F` docked Find + Replace 面板；替换 CodeMirror 默认面板但复用搜索与替换状态 |
| `EditorSearchGutter` | editor/searchGutter.ts | 行号 gutter 内的低饱和搜索命中提示 |
| `TreeView` | tree/TreeView.tsx | JSON 树 ── 自渲染递归节点，支持 path / hover 复制 |
| `DiffView` | panes/DiffView.tsx | AI Fix 接受前的 diff 展示（左原右改） |
| `HistoryModal` | history/HistoryModal.tsx | 历史列表 Modal：搜索、筛选、载入、Pin / Star / Clear |
| `HistoryItem` | history/HistoryModal.tsx | 历史单行 UI：op chip、摘要、Pin / Star 操作 |
| `SettingsView` | settings/SettingsView.tsx | 主壳内设置页（左侧 nav + 右侧 panel） |
| `ShortcutInput` | settings/ShortcutInput.tsx | 录入快捷键 + 冲突检测 |
| `ApiKeyInput` | settings/ApiKeyInput.tsx | masked 输入 + 测试连接 |
| `ShortcutPermissionModal` | permissions/ShortcutPermissionModal.tsx | macOS 全局快捷键权限恢复弹窗 |

## 4 关键自定义组件详设

### 4.0 EditorSearchPanel + EditorSearchGutter

`EditorSearchPanel` 是 CodeMirror `search({ createPanel })` 的 DOM panel，不是 React 组件。它 dock 在 TabBar 下方、编辑正文上方，打开时只压缩编辑区高度，不覆盖 JSON 文本。

| 子区 | 规则 |
| --- | --- |
| Find row | 搜索输入、match count、上/下一个、`Aa`、`.*`、`word`、`All`、关闭。 |
| Replace row | 替换输入、`Replace` 当前匹配、`All` 替换全部；按钮低对比，不使用高饱和主按钮。 |
| Shortcut | `⌘F` 首次打开搜索；搜索已打开时再次 `⌘F` 关闭搜索，形成快速 toggle。 |
| Buttons | 使用低对比 chip/icon button，active 用 `--control-bg-active` + `--primary-edge`。 |
| Count | `x / n`，超过计数上限显示 `1000+`。 |
| i18n | 文案从 `panes.search.*` 读取；不得 hardcode 英文。 |

Jsonita search panel 提供 replace UI，但不提供 `⌘R` / `Cmd+R` replace 快捷键；用户必须通过 `⌘F` 打开的面板输入替换内容并点击按钮执行。

`EditorSearchGutter` 使用 CodeMirror `lineNumberMarkers`，在行号 gutter element 上加 class，再由 CSS `::before` 画弱竖线。它不能新增明显的独立列，不能替换行号数字，不能使用高饱和色。

### 4.1 TabBar

顶部功能区：左侧 5 个基础 Tab（Format / Minify / Tree / →Str / →JSON）+ AI Fix（仅错误态相关）+ 右上设置按钮。视觉见 [design/01 § 1.1-1.5](01_mockups.md) （默认 / 各 Tab 切换 / AI Fix 出现）。

```
// src/shell/TabBar.tsx
export type Pane = 'format' | 'minify' | 'tree' | 'json-to-str' | 'str-to-json' | 'ai-fix';

interface TabBarProps {
  active: Pane;
  showAiFix: boolean;       // 仅在编辑器 parse error 时为 true
  onChange: (p: Pane) => void;
}
```

关键契约：

AI Fix Tab 条件渲染 ：仅 `showAiFix = true` （编辑器 parse error）时渲染；从 idle 到出现走 fade-in 150ms

ai variant 视觉 ：使用低透明 `--accent-soft` 和细边框提示这是"修复"入口；不使用橙色渐变、glow 或大面积彩色块

active 动效 ：active Tab 背后使用独立胶囊层，点击或 `Tab` / `⇧Tab` 切换时走 180ms 位移与宽度过渡；文字颜色 / weight 同步过渡，避免键盘切换时只有瞬时跳变

设置入口 ：右上角固定设置图标按钮，点击区不小于 34 × 30 px，默认态保留弱边框与 soft 背景， `aria-label=Open settings` ，tooltip 显示 `⌘,` ；点击后主壳内部切到 `SettingsView`

字体与密度 ：Tab button 使用 `--font-ui` 和浮窗派生的 `--fs-sm`，保持 macOS 工具栏的小字号质感；不要使用 `--font-code`，也不要让 Tab 文字等比例追随编辑器字号放大。active pill 只表达当前位置，不能变成大面积高亮按钮。

键盘 ：当焦点不在 CodeMirror / input / textarea / select / contenteditable 内时，裸 `Tab` 正向、 `⇧Tab` 反向循环切换功能 Tab；焦点在 Tab 按钮本身时， `Enter` / `Space` 走原生 button 激活。AI Fix 仅在可见且启用时加入循环。 不绑 `⌘1-6` （见 [plan/02 § 1.1](../design/02_interaction.md) ）

### 4.2 StatusBar

底部状态栏。4 态完整视觉见 [design/01 § 2 状态栏 4 态对照](01_mockups.md)。

```
interface StatusBarProps {
  status: 'valid' | 'error' | 'empty' | 'large';
  errorLoc?: { line: number; col: number; msg: string };
  meta?: { lines: number; bytes: number };
  historyCount: number;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
}
```

| status | 左侧文案 |
| --- | --- |
| `valid` | "● Valid JSON · X lines · Y bytes" |
| `error` | "● Invalid JSON"；位置和详细 reason 交给 inline lint tooltip / 局部 gutter marker |
| `empty` | "—"（无圆点） |
| `large` | "● Large file · X bytes" |

右侧固定 History 按钮，点击或 `⌘Y` 打开历史； `Switch to [Single / Split] Panel` 与 History 对称，平时只显示文字，hover 或键盘 focus 时各自滑出快捷键 badge。状态栏使用 `--font-ui`，只有行数、字节数和快捷键 badge 使用 `--font-mono-ui`；不要让整条状态栏变成等宽字体。状态栏只叠极轻 surface 和顶部分隔线；设置入口不再放在状态栏，改由 TabBar 右上角按钮与 `⌘,` 承担。StatusBar 使用浮窗缩放域中的 `--fs-xs`，随编辑器字号轻微缩放并封顶，保持单行高度紧凑。

### 4.2.1 SinglePaneHint

单窗模式专用的右下角提示组件。仅当 `settings.singlePaneMode=true` 且 active pane 不是 Tree 时渲染，位置固定在编辑器右下角、状态栏上方，提示 `⌘↵` Run {pane}； `⌘Enter` 执行时切换为 running / applied / failed 短反馈。Tree 是视图模式，直接整栏渲染 `TreeView`，不显示 Run hint。提示正文使用 `--font-ui`；只有 `kbd` 使用 `--font-mono-ui`。

```
// src/shell/SinglePaneHint.tsx
type SinglePaneApplyState = 'idle' | 'running' | 'success' | 'error';
```

### 4.2.2 ShortcutHint（已移除）

旧版浮窗 show 时会在右下角显示一块 temporary keymap HUD（ `Esc` /`Tab` /`⇧Tab` ）。玻璃方向落地后该 HUD 不再渲染：主窗只保留状态栏两个 hover/focus 快捷键 badge 与单窗模式 `SinglePaneHint`，避免覆盖编辑区并回到旧 flat 深色浮层观感。

### 4.2.3 EditorFrame 空态与 pane surface

`FloatingWindow` 在 `Editor` 外包一层 `EditorFrame`。它不改变 CodeMirror 文本，不写 store，只在当前 pane 为空时显示 overlay 引导。

| 区域 | 规则 |
| --- | --- |
| Input 空态 | 显示 `{ }` 小标记、`Paste JSON` 和一行短 meta；位置靠近编辑器起始行，不能居中做 hero，也不能覆盖行号。 |
| Output 空态 | 显示轻量结果占位，说明输出会在这里出现；空态不能使用 CodeMirror placeholder 字符串代替，因为那会让左右栏读起来像一块空 editor。 |
| Pane surface | 输入 / 输出 pane 都有极轻 `surface-quiet` 叠层；双栏中间用弱分隔线，单窗模式移除中线。 |
| 字体 | 空态标题与说明使用 `--font-ui`，JSON 小标记使用 `--font-code`。 |
| 禁止 | 不做大插画、不做营销式说明、不显示历史 phase 或 TODO 文案、不把空态写入编辑器内容。 |

### 4.3 Toast（reserved / future）

当前代码没有 `src/shell/Toast.tsx`，也未接入 `sonner`。运行时错误目前由状态栏、AI 面板局部错误、Shortcut Permission Modal 和 Settings 页面局部错误呈现；以下 API 是后续接入 Toast 时的保留契约。

```
// src/shell/Toast.tsx ── API 契约
export const toast = {
  info:    (m: string, opts?: ToastOpts) => void;
  ok:      (m: string, opts?: ToastOpts) => void;
  warn:    (m: string, opts?: ToastOpts) => void;
  danger:  (m: string, opts?: ToastOpts) => void;
};

interface ToastOpts {
  description?: string;
  action?: { label: string; onClick: () => void };
  duration?: number;        // 默认 5000；带 action 时 8000
}
```

未来接入后，每个 variant 对应一个 className（ `toast-info / toast-ok / toast-warn / toast-danger` ），样式由全局 CSS 注入。Position 固定 `bottom-right`；同时最多 3 个堆叠，超出旧的自动 dismiss。

### 4.4 HistoryModal + HistoryItem

`src/history/HistoryModal.tsx` 在 `App.tsx` 中常驻渲染，由 `historyModalOpen` 控制显隐。底部 StatusBar 的 History 按钮或 `⌘Y` 打开 Modal； `Esc`、再次 `⌘Y` 或点击遮罩关闭。Modal 支持列表、搜索、All / Pinned / Starred 筛选、点击条目载入编辑器、Pin / Star，以及 Clear 非 pinned/starred 条目。

```
interface HistoryItemProps {
  row: HistoryRow;
  selected: boolean;
  onLoad: (id: number) => void;     // 双击 / Enter 载入到编辑器
  onPin: (id: number) => void;
  onStar: (id: number) => void;
  onClearPlainRows: () => void;
}
```

关键契约：

op-type chip ：每行左侧显示 op_type 的低饱和色彩 chip（format/minify 用蓝灰 / tree 用 info / str-json 互转用 ok / ai-fix 用 accent） ── 让用户扫一眼能识别操作类型，但不能抢过 JSON 摘要

显式写入 ：AI Fix Accept、单窗 `⌘Enter` 成功应用 Format / Minify / →Str / →JSON 时写入 history；普通编辑输入不自动写入，避免噪音

列表行 hover / focus 只显示弱 surface 背景和左侧细标，不使用整行强色高亮。filter、Pin、Star、Clear、搜索框和 footer 按钮统一走 `--control-*` token。

保留策略 ：Clear 只删除普通条目；pinned / starred 保留，与 SQLite `history_clear` 契约一致

### 4.6 SettingsView

Settings 是主壳内页面状态，不是 overlay dialog。点击右上角齿轮、tray Settings 或 `⌘,` 后，主 Jsonita 卡片内部从 editor workspace 切换为 Settings workspace；外层圆角、阴影、玻璃背景和窗口尺寸保持同一张卡片。左侧 nav（W 150）是固定目录索引，右侧是单一连续滚动配置页，按 General / Shortcuts / AI / History / JSON Transform / About 从头到尾顺序渲染；点击目录滚动到对应 section，右侧滚动时目录高亮跟随。目录点击触发的 smooth scroll 期间必须锁定被点击的目标项，不允许高亮依次闪到滚动途中经过的 section；滚动到目标附近后再恢复普通 scrollspy。底部 footer（Done / Reset）固定，`Esc`、Done 和 Settings 页内 `⌘W` 都返回 editor workspace。

规则：所有改动 即时生效 （不需要 Done 按钮提交，每个 Switch / Select 变化立刻 `settings_set` ）。Done 仅关闭 Settings 页面。Reset all 直接恢复默认。

当前实现尺寸：`SettingsView` 继承外层浮窗尺寸；左 nav 150，右侧 scroll container 自适应剩余宽度，section 间距 28px。当前以真实实现为准。

| 分组 | 组件 | 状态 / 副作用 |
| --- | --- | --- |
| General | `select(locale)` ·`select(theme)` ·`SettingsCheckbox` × 5 | patch `locale/theme/launchAtLogin/hideOnBlur/smartWidth/singlePaneMode/autoPasteClipboard` |
| Shortcuts | `ShortcutInput` × 3 + read-only `KbdGroup` | 可改 global toggle / restore-last 与窗口内 split toggle；内置 keymap 不可编辑 |
| AI | `SettingsCheckbox(aiEnabled)` + `ApiKeyInput` | 开关控制所有 AI 入口；key 通过 secrets store，不进入 settings |
| History | `select(historyLimit)` | 影响 SQLite history 裁剪策略 |
| JSON Transform | `SettingsCheckbox(autoUnwrap)` · number input ·`SettingsCheckbox(editorSoftWrap)` | 影响 JSON 引擎、CodeMirror 软换行、智能缩放指标 |
| About | 只读 metadata + GitHub button + path chips | `open_github` 在系统浏览器打开仓库 |

Boolean 控件：当前实现使用自定义 `SettingsCheckbox` 包裹原生 `input[type=checkbox]`。视觉为小号圆角方块 + `--control-bg-active` checked 态，勾选图标使用 currentColor，避免系统默认蓝色 checkbox 与深色浮窗割裂；原生 input 透明覆盖，保留点击、键盘和屏阅器语义。

Settings 左侧目录 active 项使用弱 `--control-bg-active` 和左侧 2px 内阴影标记，不铺高饱和蓝色块。右侧连续页面、footer、select、number input、ShortcutInput 和 ApiKeyInput 都使用 `--control-*`，让 Settings 像主壳内的配置文档，而不是另一套表单 UI。

About 分组：使用轻量信息面板展示产品名、版本、License、作者与数据目录；右上角提供 GitHub 外链按钮，调用 `open_github` command 在系统浏览器中打开仓库。

### 4.6.1 ShortcutPermissionModal

权限弹窗只在 macOS 全局快捷键或辅助功能权限不可用时出现。它是全局 dialog，但视觉仍必须跟 Native Quiet Glass 一致：

| 子区 | 规则 |
| --- | --- |
| Overlay | 使用 `--bg-overlay`，不硬编码黑色透明度。 |
| Card | 使用 `--bg-elevated` + `--glass-border` + `--shadow-lg`，保留 `--glass-blur`。不得使用纯白卡片、emoji hero 或独立字体栈。 |
| Icon | 使用小号 `⌘` token chip，表达快捷键权限，不使用彩色 emoji。 |
| Buttons | Later 和 Open System Settings 都走 `--control-*`；主按钮用 `--control-bg-active` + `--primary-edge`，不使用实心高饱和蓝。 |
| Copy | 标题正文走 i18n；正文颜色用 `--text-muted`，避免弹窗比编辑器更抢眼。 |

### 4.7 ShortcutInput

设置面板 Shortcuts 分组内的录入控件，视觉嵌入 `SettingsView` 的 Shortcuts panel。

```
interface ShortcutInputProps {
  value: string;            // "Cmd+Shift+J" 风格
  onChange: (next: string) => void;
  onConflict?: (info: ShortcutRegisterResp) => void;
}
```

录入 UX：

未聚焦：显示当前值，hover 高亮可点

聚焦：变红色提示 "Press keys to record..."；listen `keydown`

用户按下组合（如 `⌘⇧J` ）：解析 modifiers + key → 调 `shortcut_register` 验证

冲突：变红 + Tooltip 提示 `Already used by {with_app || "system"}` ，不写入

成功：变绿 1s 后回 default 状态

展示规则：设置页不直接展示 `CmdOrCtrl` 占位符。macOS 显示 `⌘` /`⇧` /`⌥` 等符号；Windows 显示 `Ctrl` /`Shift` /`Alt` 文本。Shortcuts 分组同时展示不可编辑的内置 keymap（ `Tab` /`⇧Tab`、 `Esc`、 `Esc` `Esc`、 `⌘↵`、 `⌘Y`、 `⌘K`、字号缩放等），避免用户只能从短提示里猜。

### 4.8 ApiKeyInput

设置面板 AI 分组内的 API key 录入 + 测试连接控件。视觉嵌入 `SettingsView`。

```
interface ApiKeyInputProps {
  hasKey: boolean;          // secrets.json 里已存时为 true
  onSubmit: (key: string) => Promise<void>;
  onTest: () => Promise<TestConnectionResp>;
}
```

UX：

已有 key：输入框显示 `••••••••` （mask），右侧 [Replace] 和 [Test] 按钮

无 key：placeholder "sk-..."，右侧 [Save] + [Test]

Test 中：按钮显示 `...` ；返回后在输入区下方显示 ok / error 文本

Test 不消耗存好的 key：直接输入框的当前值传给 `ai_test_connection` （详见 [I00 AI provider protocol](../spec/platform/I00-ai-provider-protocol.md) ）

### 4.9 TreeView（含 Hover 复制）

JSON 树视图。视觉：见 [design/01 § 1.3 Tree Tab 与 § 12 hover 复制](01_mockups.md)。实现细节： [08 § 4.5](08_editor.md)。

```
interface TreeViewProps {
  data: unknown;                   // 解析后的 JSON
  initialExpandDepth?: number;     // 默认 2
  onPathClick?: (path: string) => void;     // 点击 key → 复制 path
  onCopyNode?: (info: CopyNodeInfo) => void; // 点击行尾 copy action → 复制 value/subtree
}

interface CopyNodeInfo {
  path:   string;     // 'user.items[2]'
  isLeaf: boolean;
  text:   string;     // 计算好的可直接 writeText 的字符串
}
```

| node 类型 | hover 出现位置 | 复制内容 |
| --- | --- | --- |
| string leaf | 行尾 | 带引号 raw `"alice"` |
| number / bool / null leaf | 行尾 | 字面量 `30` /`true` /`null` |
| object / array | 标签行尾 | 递归 pretty-print JSON（2 空格缩进） |

交互约束：TreeView 维护唯一 `activeCopyKey`，父子节点不会同时显示 copy action；copy action 是无边框 / 无背景的轻量文字提示，hover 不改变整行 cursor。复制后的 `copied` 反馈在离开当前节点、切到其他节点或离开 Tree 容器时立即清理。Tree 获焦时 `⌘A` 选择 root，随后 `⌘C` 复制整棵树；应用 chrome 通过全局 hotkey 阻止 DOM 全页选择。

### 4.10 DiffView

AI Fix 应用前的 diff 展示。视觉（双栏 / 行染色 light+dark）见 [design/01 § 8 AI Fix DiffView](01_mockups.md)；diff 算法实现见 [I00 AI provider protocol](../spec/platform/I00-ai-provider-protocol.md)。

```
interface DiffViewProps {
  before: string;
  after: string;
  onAccept: () => void;
  onReject: () => void;
}
```

关键契约：

使用 npm `diff` 库的 `diffLines` ，输出 `{ type: 'eq'|'add'|'del', text }[]`

不引 monaco-diff（300 KB 太重）

Accept 按钮使用 accent / amber variant，并内嵌 `⌘↵` shortcut hint；Reject = outline variant；位置见 mockup

## 5 布局组件清单（无业务）

| 名称 | 用途 |
| --- | --- |
| `SplitPane` | 左右双栏（input \| output）；记忆拖拽宽度到 localStorage |
| `ResizeHandle` | SplitPane 的拖拽柄 |
| `EmptyState` | 无数据 placeholder（无历史 / 无 API key / 无内容） |
| `Spinner` | 按钮内 loading（圆环 12 × 12，1s 旋转） |
| `KbdGroup` | 渲染 "⌘⇧J" 这种组合（用 <kbd> 多个） |

## 6 状态变体清单（横向核验）

所有交互组件必须实现完整 6 态：

| 态 | 判定 | 视觉变化 |
| --- | --- | --- |
| default | 无交互 | token 默认值 |
| hover | 鼠标悬停 | bg → soft / cursor pointer |
| focus-visible | 键盘聚焦 | + `box-shadow: var(--shadow-focus)` |
| active | 按下中 | opacity 0.9 / scale 0.98 |
| disabled | 不可点 | opacity 0.5 + cursor not-allowed |
| loading | 异步进行中 | + Spinner + 文字微调 / pointer-events none |

WARN

不要 用 `:focus` 而要用 `:focus-visible` ── 避免鼠标点击也出现 focus ring。所有 shadcn 组件已用 `:focus-visible`，自写组件须同步。

## 7 不实现的组件（v1 红线）

Tour / Onboarding 浮层 ── 工具应自解释，不引导

Splash screen ── 启动越快越好，不放 logo 屏

Banner / Announcement ── 无 PM 渠道发公告

Avatar / 用户系统 ── 不登录

Drag & Drop file ── v1 不读 fs，仅剪贴板
