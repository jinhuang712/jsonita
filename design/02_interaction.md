PLAN · 章节 02

# 交互草图

主浮窗 HTML mockup + 关键流程 + 行为细节。

## 1 主浮窗

Format

Minify

Tree

→Str

→JSON

AI Fix

Input

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b", "c"]
}
```

Tree

▾ root {3}

name: "alice"

age: 30

▾ items [3]

[0]: "a"

[1]: "b"

[2]: "c"

● Valid JSON · 5 lines · 76 bytes ⌘Y History

尺寸 ：首次呼出 860 × 560（克制 ── 不占满屏，初次也不太小）；手动拖拽硬下限 440 × 340；智能缩放的舒适区 floor 不低于默认 860 × 560，只负责给大内容 / 大字号更多空间，不因小 JSON 自动缩窄；最大不超过屏宽 × 70% / 屏高 × 72%，并封顶 1400 × 900 px；可调整、记忆上次大小（详见 [F10 浮窗智能缩放](../plan/01_features.md#f10-浮窗智能缩放) ）

拖动 / 缩放 ：顶部 TabBar 空白区域可拖动窗口；无边框窗口通过 8 个隐形 resize handles 支持边 / 角拖拽缩放；用户手动缩放会记忆尺寸并暂停自动缩放，直到用户执行 Reset Size 后回到内容驱动模式

位置 / 多屏 ：呼出在 当前光标所在屏幕 的中央偏上 1/3 处，不遮挡顶部菜单栏；v1 不记忆位置

层级 / 切应用 ：始终置顶（NSPanel-like），不抢焦点、不被覆盖； `⌘Tab` 切应用时浮窗不消失

失焦行为 ：默认自动隐藏，可在 General 设置关闭（必须可关，见 `00_overview` C 硬约束）

### 1.0.1 Tree hover copy

鼠标悬停任意 node 时，右侧浮出描边 copy 图标 + `copy` 文案（仅 hover 出现）；点击复制后短暂显示 `copied` + 勾选图标。

唯一 action：父子节点 hover / focus 叠加时只显示当前节点的 copy 按钮；切换节点或离开 Tree 后立即清除 copied 反馈，避免按钮残留。

leaf 节点（string / number / bool / null）复制 raw value，带原始引号或字面量：`"alice"` / `30` / `true` / `null`。

object / array 节点（含 root）递归复制完整子树为 pretty-printed JSON（2 空格缩进），即"以该 node 为新 root 的合法 JSON"。

与点 key 复制 path 不冲突：点 key 仍复制 path；hover 出现的 copy action 与 key 点击行为分开。

键盘可达：聚焦在某个 node 行时按 `⌘C` 等同于点 copy action。

`⌘A` 语义：只在编辑器 / 表单内使用系统文本全选；Tree view 内 `⌘A` 选择整棵树，随后 `⌘C` 复制 root subtree；页面 Tab / 状态栏等 chrome 永远不会被 DOM 选中。

### 1.0.2 Editor input interactions

左侧 input panel 使用 CodeMirror 6；同一套交互适用于 Format、Minify、→Str、→JSON 等所有 input 区。

| 能力 | 交互要求 |
| --- | --- |
| Soft-wrap 软换行 | 长行自动换行，不出现水平滚动条；默认开启，设置可关闭 |
| 括号匹配 | 光标停在 `{` / `[` 时，对应 `}` / `]` 高亮蓝框；由 CodeMirror `bracketMatching` extension 承载 |
| 缩进引导 | 每层缩进显示浅色 vertical guide line；由 `indentationMarkers` extension 承载 |
| 折叠 | 大数组 / 大对象超过阈值时自动折叠为 `[ ... ]` / `{ ... }`；点击展开 / 收起 |
| 编辑器内置能力 | 行号、当前行高亮、`⌘F` 搜索、`⌘D` 多光标、`⌘Z` undo 走 CodeMirror 6；搜索面板使用 Jsonita docked UI |
| 行号对齐 | line number gutter 与正文行共用编辑器字号和 code 行高；当前行 gutter 高亮与正文当前行背景在 y / height 上保持一致 |

`⌘F` 搜索打开时，搜索条插入在顶部 TabBar 下方，不覆盖 JSON 文本。命中结果在正文中以低透明 primary tint 标出；左侧行号 gutter 只显示低饱和细竖线提示本行有命中，当前命中行略强，但不能接近错误 marker 的强度。关闭搜索后，正文 match 和 gutter hint 同时消失。

### 1.1 Tab 切换

顶部功能 Tab：Format / Minify / Tree / →Str / →JSON；AI Fix 仅在 parse error 且 AI 可用时出现在最右，右上角固定设置按钮。切换靠鼠标点击，或在非编辑态按 `Tab` 正向 /`⇧Tab` 反向循环；焦点在 CodeMirror / 表单输入内时不拦截 Tab。active 状态 = 冷色焦点态，并通过 180ms 胶囊位移 / 宽度过渡强化键盘切换手感。

CodeMirror 内按 `Tab` 只执行缩进，不触发窗口尺寸重算；智能缩放只响应结构行宽、行数、字号等有意义变化，避免单次缩进造成窗口跳变。

单窗模式下切换 Tab 只改变待执行功能，不自动改写编辑器；右下角提示当前可按 `⌘Enter` 执行 active Tab 并把结果写回输入区。

编辑器字体可用 `⌘+` /`⌘-` 调整（每次 2px）， `⌘0` 回到默认字号；字体变化会参与动态窗口缩放。缩放完整作用于 CodeMirror 正文、Tree 和顶部功能 Tab（Format / Minify 等），让 Tab 标签成为当前字号的即时参照；状态栏快捷键 badge、单窗 Run hint 等紧凑 chrome 文字只轻微跟随并封顶。

不绑定 `⌘1` - `⌘6` —— 避免污染系统级常用快捷键 + CodeMirror 编辑器内 `⌘+数字` 冲突。

切换到 Tree mode 时的 Tab 条状态（AI Fix 未出现，因当前 JSON 合法）：

Tree tab 始终显示 Tree 面板；当前输入合法时渲染树，空白 / 非法 JSON 时显示 Tree 状态提示，避免看起来仍停留在普通编辑器。

Format

Minify

Tree

→Str

→JSON

JSON parse 失败时「 AI Fix 」按钮才出现在最右侧（active = Format mode）：

Format

Minify

Tree

→Str

→JSON

AI Fix

## 2 菜单栏入口

菜单栏常驻图标，点击展开菜单：

{ } Jsonita

Toggle Jsonita

Settings… `⌘,`

Quit Jsonita `⌘Q`

## 3 呼出 → 处理 → 关闭 主流程

STEP 01

触发

按 `⌘⇧J` 或点击菜单栏图标

→

STEP 02

浮窗出现

150 ms 淡入；输入框聚焦；剪贴板若含 JSON 则自动粘贴

→

STEP 03

处理

debounce 300 ms 后实时格式化 + 右侧同步渲染树状视图

→

STEP 04

关闭

编辑器内第一下 `Esc` 退出 editing；非编辑态连续两次 `Esc` / 失焦 /`⌘W` → 隐藏浮窗；每次呼出时右下角短暂提示 Esc / 双 Esc / Tab / ⇧Tab，不重复提示 `⌘Y` History；合法内容由实时 transform 持久化为「上次会话」

## 4 AI Fix 流程（仅错误时）

非法 JSON 时 `⌘Enter` 直接进入 AI Fix 并发起请求；单窗右下角显示 Run AI Fix，不显示 Run Format。AI Fix 未启用时不展示错误 JSON 的执行提示，只在右上角保留弱化 AI Fix 提示入口。Diff 决策态 `⌘Enter` 接受修复， `Esc` 取消，并在右下角短提示中替换为 Accept / Cancel 语境。单双栏模式规则一致。

STEP 01

检测失败

JSON parse 失败 → 状态栏变红 + 「AI Fix」按钮出现

→

STEP 02

点击

按钮 loading；调 DeepSeek（不做客户端节流，透传上游 429）

→

STEP 03

本地验证

try-parse 返回；非法 → 显示原始返回供调试

→

STEP 04

用户决定

diff 展示修复点 → 接受 / 撤销

## 5 状态指示

| 状态 | 状态栏 | 额外呈现 |
| --- | --- | --- |
| 合法 JSON | ● Valid JSON · X lines · Y bytes | 绿色圆点 |
| 语法错误 | ● Invalid JSON | 输入框红波浪线 + 低饱和局部 gutter marker 标注位置，并补充标出常见非法 token；详细 reason 由 inline lint tooltip 承载 + AI Fix 按钮 |
| 空输入 | — | 右侧 placeholder: `Paste JSON to start` |
| 过大 (> 5 MB) | ● Large file · X bytes | 不调 JSON engine，避免卡顿 |
| AI 调用失败 | — | AI Fix 面板显示错误信息（含上游 429 限流，透传 `retry-after` ） |

### 5.1 错误呈现矩阵

错误类型的完整 payload 定义见 [spec/appendix/errors](../spec/appendix/schemas.md)，IPC 返回契约见 [spec/04](../spec/04_error_model.md)。

| 错误 kind | 常见 command | UI 呈现 | 用户操作建议 |
| --- | --- | --- | --- |
| `Parse` | json_format / minify / stringify | 状态栏红 + 高亮位置 | 点 AI Fix 或手动修 |
| `UnwrapTimeout` | json_unwrap_stringified | 状态栏 / 局部错误 | 建议关 auto-unwrap 或提高超时 |
| `Sqlite` | history_* / session_* | 调用方捕获；当前多处静默忽略，后续补统一错误 UI | 反馈 issue |
| `Secrets` | ai_set_api_key / ai_fix | AI 面板错误 / 设置项错误 | 检查数据目录权限 / 磁盘空间 |
| `Http` | ai_fix / ai_test_connection | AI 面板错误 / API key 输入区错误 | 检查网络 / API key |
| `RateLimit` | ai_fix | AI 面板显示 retryAfterSec | 等待 retryAfterSec 后重试 |
| `AiInvalidJson` | ai_fix | AI 面板错误文本 | 必要时反馈 issue |
| `Io` | open_log_dir / open_db_path | 调用方捕获；当前未做全局 Toast | 反馈 issue |

## 6 设置面板交互

打开入口：右上角设置图标、菜单栏 Settings…、或 `⌘,`。Modal 打开时读取 `settings_get_all`，并订阅 `settings:changed`；左侧 6 个 nav 项切换右侧 panel，不重建整个 Modal。

| 分组 | 核心交互 | 结果 |
| --- | --- | --- |
| General | 语言 / 主题 select；开机、失焦、智能缩放、单窗、自动粘贴用方形 checkbox | 每次变化立即 `settings_set`；主题变化同步原生玻璃解析 |
| Shortcuts | 点可自定义快捷键 → 录入组合 → 检查冲突；内置快捷键只读 | 成功写入设置并重新注册；冲突 / 系统保留组合不写入 |
| AI | 启用开关；API key 输入；Test / Save / Remove | Test 不污染已存 key；Save 写 `secrets.json`；Remove 幂等删除 |
| History | 历史上限 select：10 / 50 / 100 / 200 | 后续写入 history 时按 pinned / starred / 时间策略裁剪 |
| JSON Transform | 自动解嵌套、unwrap timeout number、soft-wrap checkbox | 影响 Format / Tree / 编辑器渲染与智能缩放计算 |
| About | GitHub 按钮、版本 / License / 作者 / 数据路径只读展示 | GitHub 走系统浏览器；路径用于用户排查与卸载 |

底部按钮：Done 只关闭 Modal；Reset all 调 `settings_reset` 并广播 `settings:changed`。设置项没有“Apply”步骤，避免用户误以为更改处于未保存状态。

### 6.1 Single-pane status controls

状态栏 `Switch to [Single / Split] Panel` 控件可即时切换 single-pane / split-pane，快捷键为 `⌘\`。

切换只改布局，不自动改窗口尺寸；“顺势缩窄”实测 clunky 已移除。窗口尺寸仍随内容智能缩放。

该状态栏控件与 History 一样平时只显文字，hover / 键盘聚焦才浮现键位，详见 [design handoff § 5](HANDOFF.md)。

### 6.2 Single-pane run hint

非 Tree 功能右下角固定提示 `⌘↵` Run {pane}；运行中 / 成功 / 失败在同一位置短暂反馈。

Tree 模式不是执行动作：切到 Tree 后主区域始终是 Tree 面板；合法 JSON 显示 `TreeView`，空白 / 非法 JSON 显示明确状态，不静默退回编辑器。

因为结果写回同一个 CodeMirror 文档，`⌘Z` 可以撤销本次应用。

`⌘Enter` 应用成功后覆盖 `last_session`；SQLite history 仍只在 AI Fix 接受等显式路径写入。

single-pane 下点击 AI Fix tab 直接进入 `AiFixPane` 并自动调用 `ai_fix`，展示同双栏一致的 loading / DiffView / Accept / Cancel；不通过右下角 `⌘Enter` hint 触发。
