# 原型图 & 交互细节

所有界面真实 HTML/CSS mockup ── 每个 mock 左右 light/dark 双版。本章是 Jsonita 视觉层的唯一权威。

单窗 Tree 不是执行动作：切到 Tree 且 JSON 合法时，主区域直接显示树视图，不出现右下角 `⌘↵` Run 提示。

其他章节（04 组件库 / 06 窗口 / 07 菜单栏 / 08 编辑器）若需引用界面外观，均链到此章对应 § 节。 不允许 在别处重复画 UI。

阶段 3 已落地：本章已从 flat 重绘为 原生玻璃（macOS vibrancy） 视觉权威；材质 / 调色 / 动效出处仍见 [design/HANDOFF.md](HANDOFF.md) 与 `design/jsonita-*.md` prototype source blocks。当前实现使用 Tauri 透明窗口 + macOS window effects；CSS mockup 用 `backdrop-filter` 仅模拟文档预览。实现层必须保持主窗单层玻璃 tint，TabBar / StatusBar / editor 只用轻量叠层，避免叠成旧 flat 深色面板。

## 1 主浮窗 ── 6 种状态

### 1.1 Format Tab · valid JSON（默认呼出后）

light

Format

Minify

Tree

→Str

→JSON

Settings

Input

```
{"name":"alice","age":30,"items":["a","b","c"]}
```

Output · 2 spaces

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}
```

● Valid JSON · 5 lines · 76 bytes ⌘Y History

dark

Format

Minify

Tree

→Str

→JSON

Settings

Input

```
{"name":"alice","age":30,"items":["a","b","c"]}
```

Output · 2 spaces

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}
```

● Valid JSON · 5 lines · 76 bytes ⌘Y History

顶部 Tab 条 ：6 个 Tab（AI Fix 仅在 parse error 时出现，见 § 1.5）

左右栏 ：1:1 等宽，可拖动 resize；记忆到 `window.json`

JSON 类型染色 ：见 [03 § 2](03_design_tokens.md) 颜色 token

### 1.2 Minify Tab

light

Format

Minify

Tree

→Str

→JSON

Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

Output · single line

```
{"name":"alice","age":30}
```

● Valid JSON · 1 line · 26 bytes History

dark

Format

Minify

Tree

→Str

→JSON

Settings

Input

```
{
  "name": "alice",
  "age": 30
}
```

Output · single line

```
{"name":"alice","age":30}
```

● Valid JSON · 1 line · 26 bytes History

### 1.3 Tree Tab（含 hover 复制 ── 见 § 12）

light

Format

Minify

Tree

→Str

→JSON

Settings

Input

```
{
  "user": {
    "name": "alice",
    "active": true,
    "age": 30
  },
  "items": ["a", "b", "c"]
}
```

Tree · hover 行尾 Copy

▾ root {2}

▾ user {3}

name: "alice"

active: true

age: 30

▾ items [3]

[0]: "a"

[1]: "b"

[2]: "c"

● Valid JSON · 11 nodes History

dark

Format

Minify

Tree

→Str

→JSON

Settings

Input

```
{
  "user": {
    "name": "alice",
    "active": true,
    "age": 30
  },
  "items": ["a", "b", "c"]
}
```

Tree · hover 行尾 Copy

▾ root {2}

▾ user {3}

name: "alice"

active: true

age: 30

▾ items [3]

[0]: "a"

[1]: "b"

[2]: "c"

● Valid JSON · 11 nodes History

### 1.4 →Str / →JSON 互转

结构同 § 1.1，仅 active tab 与 panel 内容变。略 ── light/dark 配色规则同 § 1.1-1.3。

### 1.5 错误状态 + AI Fix Tab 出现

light

Format

Minify

Tree

→Str

→JSON

AI Fix

Settings

Input · 非法

```
{
  name: 'alice',
  age: 30,
  items: ["a","b",],
}
```

Output · 错误

```
// 等待修复后输出
```

● Line 2, Col 3: key must be a string History

dark

Format

Minify

Tree

→Str

→JSON

AI Fix

Settings

Input · 非法

```
{
  name: 'alice',
  age: 30,
  items: ["a","b",],
}
```

Output · 错误

```
// 等待修复后输出
```

● Line 2, Col 3: key must be a string History

### 1.6 单窗模式（Single-pane）

light

Format

Minify

Tree

→Str

→JSON

Settings

In-place editor · ⌘Enter applies active tab

```
{
  "name": "alice",
  "age": 30
}
```

`⌘↵` Run Format

● Valid JSON · single-pane History

dark

Format

Minify

Tree

→Str

→JSON

Settings

In-place editor · ⌘Enter applies active tab

```
{
  "name": "alice",
  "age": 30
}
```

`⌘↵` Run Format

● Valid JSON · single-pane History

## 2 状态栏 ── 4 态对照

| 状态 | light | dark |
| --- | --- | --- |
| valid | ● Valid JSON · 5 lines · 76 bytes | ● Valid JSON · 5 lines · 76 bytes |
| error | ● Invalid JSON · Line 3, Col 12 | ● Invalid JSON · Line 3, Col 12 |
| empty | — Paste JSON to start | — Paste JSON to start |
| large | ● Large file · 5.4 MB | ● Large file · 5.4 MB |

状态栏右侧交互（阶段 1 已实现 →[07 § 2](07_menubar.md) ·[design/HANDOFF.md](HANDOFF.md) § 5）：右侧两个控件 对称 —— `Switch to [Single / Split] Panel` （切换单窗 / 双栏，纯文字无图标）与 `History`。两者平时只显文字，hover / 键盘聚焦才 滑出 各自快捷键（ `⌘\` /`⌘Y`；max-width + opacity + translateX，~150 ms `--ease-native` ）。点 `Switch…` 或按 `⌘\` 即时切换布局 （不改窗口尺寸，避免 toggle 抖动）；单窗下左侧不再显示 "single-pane"（与右侧控件文字重复）。

## 3 菜单栏 tray + 下拉菜单

左键 toggle 浮窗；右键弹下拉。tray 图标用 template variant 自动反色（见 [05 § 3.5](05_icons_theme.md) ）。

light menubar

![](../assets/icons/menubar/jsonita-menubar-template-22@2x.png) Jsonita

10:42

Toggle Jsonita

Settings… `⌘,`

Quit Jsonita `⌘Q`

dark menubar

![](../assets/icons/menubar/jsonita-menubar-template-22@2x.png) Jsonita

10:42

Toggle Jsonita

Settings… `⌘,`

Quit Jsonita `⌘Q`

## 4 SettingsView

当前实现是主壳内 Settings 页面，不是遮罩 Modal：点击齿轮、tray Settings 或 `⌘,` 后，主卡片内部整体切到设置页；Done、`Esc` 或设置页内 `⌘W` 返回编辑工作区。左 nav、右 panel + footer 占用同一张 Jsonita 卡片。所有改动即时生效，Done 仅关闭设置页，Reset all 直接恢复默认。General 只展示当前生效项；"初始宽度 / 重置浮窗尺寸"不再出现在设置面板。详版交互已从 `design/jsonita-settings-detail.md` 迁入本节和 [04 § 4.6-4.8](04_components.md)。

light

Settings

General

Shortcuts

AI

History

JSON Transform

About

General

开机自启动

智能缩放

主题 System ▾

Reset all Done

dark

Settings

General

Shortcuts

AI

History

JSON Transform

About

General

开机自启动

智能缩放

主题 System ▾

Reset all Done

### 4.1 6 分组与真实字段

| 分组 | 显示字段 / 控件 | 不显示但存在的相关字段 |
| --- | --- | --- |
| General | 语言 select、主题 select、开机自启动 / 失焦自动隐藏 / 智能缩放 / 单窗模式 / 自动粘贴剪贴板 checkbox | `showInMenubar` tray 当前始终创建； `restoreWindow` /`initialWidth` 为保留字段 |
| Shortcuts | 呼出浮窗、恢复上次会话、切换单窗 / 双栏 3 个可录入快捷键；下方展示 9 个内置快捷键 | 系统保留组合默认阻塞，Override 为 ShortcutInput 内部确认流程 |
| AI | 启用 AI Fix checkbox；DeepSeek API key password 输入；Test / Save / Remove；保存状态行内反馈 | `aiModelId` 当前默认 `deepseek-chat`，不单独暴露编辑控件 |
| History | 历史上限 select：10 / 50 / 100 / 200 | Clear 行为在 History Modal 内，不放 Settings |
| JSON Transform | 自动解嵌套 checkbox、Unwrap 超时 number、编辑器软换行 checkbox | `maxDepth` 仍为引擎选项，默认无层数限制，不放 Settings |
| About | Jsonita、版本、MIT、作者、GitHub、数据与日志路径 | 检查更新不内置，v1 由 GitHub Release 人工分发 |

控件规范：boolean 项统一用小号圆角方形 checkbox（选中 = primary 背景 + 白色 check），不用 iOS switch；下拉 / 数字输入保持紧凑，所有分组 light / dark 都只用系统蓝做交互强调。设置左 nav 只切换 panel，不触发保存；保存由每个控件变更即时完成。

## 5 历史 Modal

当前实现已渲染 History Modal：StatusBar 点击 History 打开；支持搜索、All / Pinned / Starred 筛选、点击载入、Pin / Star、Clear 普通条目。

结构：搜索框 + 筛选 chips（All / Pinned / Starred）+ ScrollArea 列表。op-type chip 配色见 [04 § 4.5](04_components.md)。

light

History

Search…

All

Pin

Star

AI-FIX Pinned · 2m ago

{"name":"alice","age":30}

FORMAT Starred · 12m ago

{"code":200,"data":{"name":"alice"}}

TREE 38m ago

[{"x":1,"y":2},{"x":3,"y":4}]

dark

History

Search…

All

Pin

Star

AI-FIX Pinned · 2m ago

{"name":"alice","age":30}

FORMAT Starred · 12m ago

{"code":200,"data":{"name":"alice"}}

TREE 38m ago

[{"x":1,"y":2},{"x":3,"y":4}]

## 6 RestoreBar（reserved / future）

当前实现不渲染 RestoreBar；上次会话通过 `⌘⇧L` 手动恢复。本节仅保留未来自动恢复 UI 的视觉备选，不作为当前实现契约。

light

↻ Restored from 3 min ago Discard ×

dark

↻ Restored from 3 min ago Discard ×

未来自动恢复版本可采用：5 秒后自动淡出，点 Discard 立即清空 + 隐藏。

## 7 Toast ── 4 variant × light/dark（reserved / future）

当前实现未接入 Toast / sonner；错误反馈走状态栏、AI 面板、设置项行内消息。本节只保留未来 Toast 视觉。

| variant | light | dark |
| --- | --- | --- |
| info | ℹ Restored from 3 min ago<br>Cmd+Z to revert | Info · Restored from 3 min ago<br>Cmd+Z to revert |
| ok | ✓ Copied: user.name<br>Path 已复制 | OK · Copied: user.name<br>Path 已复制 |
| warn | ⚠ Rate limited<br>请 42s 后重试 | Warn · Rate limited<br>请 42s 后重试 |
| danger | ✕ API key invalid<br>Open Settings | Error · API key invalid<br>Open Settings |

## 8 AI Fix · DiffView

light

AI Fix

- {

- name: 'alice',

+ {

+ "name": "alice",

"age": 30,

- items: ["a",],

+ "items": ["a"]

Cancel `⌘↵` Accept

dark

AI Fix

- {

- name: 'alice',

+ {

+ "name": "alice",

"age": 30,

- items: ["a",],

+ "items": ["a"]

Cancel `⌘↵` Accept

## 9 macOS 权限引导 Modal

light

SHORTCUT PERMISSION

需要处理系统隐私权限

如果 `⌘⇧J` 无法在其他 App 前台唤起 Jsonita，请在 macOS 隐私设置中允许 Jsonita。

稍后 打开系统设置

dark

SHORTCUT PERMISSION

需要处理系统隐私权限

如果 `⌘⇧J` 无法在其他 App 前台唤起 Jsonita，请在 macOS 隐私设置中允许 Jsonita。

稍后 打开系统设置

## 10 Empty States

### 10.1 浮窗无内容

light

Format

Minify

Tree

→Str

→JSON

Settings

{ }

Paste JSON to start

`⌘V`

→ output

dark

Format

Minify

Tree

→Str

→JSON

Settings

{ }

Paste JSON to start

`⌘V`

→ output

### 10.2 历史空 / 无 API key

结构同上 ── "No history yet · 操作过的 JSON 自动保存" / "AI Fix 未配置 · 打开设置配置 DeepSeek API key"。略。

## 11 浮窗智能缩放（plan F10）

4 层逻辑（首次 / 内容动态缩放 / 手动拖边 / soft-wrap）的视觉示意。 克制：最大不占满屏 · 初次不能太小。详细算法见 [06 § 7 智能缩放](06_window.md)。

### 11.1 层 1 ── 首次呼出（默认 860 × 560）

Format

Minify

Tree

→Str

→JSON

Settings

860 × 560 · empty

→

— Paste JSON to start History

### 11.2 层 2 ── 内容 / 字号变化后动态缩放

| 输入 | 计算 | ideal size | 行为 |
| --- | --- | --- | --- |
| 短 JSON | cols / lines 都小 | 约 600 × 360 起 | 保持克制尺寸 |
| 160 ch 长行 | cols × char_px + padding | 约 1210 × 360 | 自动加宽 |
| 多行 JSON | line_count × line_px + padding | 宽度克制，高度增加 | 自动增高 |
| `⌘+` 放大字体 | fontSize 参与 char_px / line_px | 宽高重新估算 | 避免文字挤压 |

Format

Minify

Tree

→Str

→JSON

Settings

Input · 160 ch 长行

```
{"description":"a very long single-line description that triggers auto-size","ok":true}
```

Output

```
{
  "description": "a very long ...",
  "ok": true
}
```

● Valid JSON · auto-sized for content History

### 11.3 层 3 ── 手动拖动记忆尺寸

用户拖动后立即写 `window.json` + `user_dragged = true`

下次呼出沿用

之后再粘贴长内容 / 调整字体时，只要 General「智能缩放」开启，仍会按内容重新调整

内部 `window_reset_size` command 可清掉记忆尺寸；当前 Settings 不渲染该入口

### 11.4 层 4 ── soft-wrap 保守估宽

soft-wrap = on（默认）→ 长行换行不溢出，宽度按最多 96 列估算，但仍按行数 / 字号增高。soft-wrap = off → 长行水平滚动，宽度按实际最长行估算。

## 12 Tree 节点 Hover 复制（plan F2 · design/08 § 4.5）

hover 任意节点 → 行尾出现描边 copy 图标 + `copy` 文案。leaf 复制 raw value；object/array 递归复制 pretty JSON。

light · 悬停在 leaf "alice"

Tree · hover 行尾 Copy

▾ root {2}

▾ user {2}

name: "alice" copy

age: 30

▾ items [2]

点 copy → 剪贴板 = `"alice"` （带引号 raw）；复制反馈切换为 `copied` + 勾选图标

dark · 悬停在 object root

Tree · hover 行尾 Copy

▾ root {2} copy

▾ user {2}

name: "alice"

age: 30

▾ items [2]

点 copy → 剪贴板 = 整个 subtree pretty JSON（含 user / items）

复制内容规则：

| node 类型 | 剪贴板内容 |
| --- | --- |
| string leaf | 带引号 raw： `"alice"` |
| number leaf | 字面量： `30` |
| bool leaf | `true` /`false` |
| null leaf | `null` |
| object / array node（含 root） | 递归 pretty-print 2 空格缩进 JSON |

键盘可达：聚焦节点行按 `⌘C` 等同于点 copy 图标。点击 key 文字本身仍复制 path（如 `user.name` ），两者独立。

## 13 承接关系

| 章节 | 引用本章哪节 |
| --- | --- |
| 04 组件库 · TreeView | § 1.3 · § 12 |
| 04 组件库 · SettingsView / DiffView；HistoryItem 为保留设计 | § 4 · § 8；§ 5 reserved |
| 06 窗口 runtime · 智能缩放 | § 11 |
| 07 菜单栏 · tray / 权限 | § 3 · § 9 |
| 08 编辑器 & 树 · hover 复制 | § 1.3 · § 12 |
| 11 AI 客户端 · DiffView · 无 API key | § 8 · § 10.2 |
