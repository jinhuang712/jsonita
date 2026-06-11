PLAN · 章节 01

# 功能清单

7 个模块，每个附 before / after 实例。

## F1 JSON Formatter

把任意 JSON 字符串格式化为可读 / 可压缩形式。选项：缩进（2 / 4 空格 / Tab）、Sort keys、Minify。

Input

```
{"name":"alice","age":30,"items":["a","b"],"meta":{"created":"2026-05-22"}}
```

→

Output

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b"],
  "meta": {
    "created": "2026-05-22"
  }
}
```

错误处理：实时高亮 parser 返回的非法位置（行号 + col），并补充常见非法 JSON token；错误时显示「AI Fix」入口（前提 AI 已启用）。

编辑器搜索：`⌘F` 打开 Jsonita docked 搜索条，位置在 TabBar 下方、编辑正文上方，不覆盖 JSON 文本；搜索命中在正文和行号 gutter 中使用低饱和提示，保持与整体低对比设计一致。

非法 JSON、AI Fix、单窗执行与 Diff 决策态的完整交互权威见 [design/02 § 4](../design/02_interaction.md) 与 [design/02 § 6.2](../design/02_interaction.md#6.2-single-pane-run-hint)。

编辑器 input 交互权威见 [design/02 § 1.0.2](../design/02_interaction.md#1.0.2-editor-input-interactions)，编辑器技术契约见 [design/08](../design/08_editor.md)。

## F2 JSON TreeView

JSON 解析后渲染成可折叠树状视图，方便浏览嵌套结构与复制 JSON Path。

Input

```
{
  "user": {
    "name": "alice",
    "active": true,
    "age": 30
  },
  "items": ["a", "b", "c"],
  "extra": null
}
```

→

Tree view

▾ root {3}

▾ user {3}

name: "alice"

active: true

age: 30

▾ items [3]

[0]: "a"

[1]: "b"

[2]: "c"

extra: null

点击 key → 复制 JSON Path（如 `user.name` / `items[1]` ）

折叠 / 展开任意子树；搜索高亮 key & value

大对象（> 50 keys）默认折叠到第 2 层

类型颜色： "string" · 42 · true/false · null

Hover 复制节点 （v1）：Tree node hover/focus 时提供 copy action，leaf 复制 raw value，object / array 复制 pretty-printed subtree；完整交互细节见 [design/02 § 1.0.1](../design/02_interaction.md#1.0.1-tree-hover-copy)。

## F3 JSON ↔ String 互转

常用于日志反解析、把 JSON 拷贝进代码字符串字面量等。

### F3.1 String → JSON（反解转义）

Input · escaped string

```
"{\"user\":{\"name\":\"alice\",\"age\":30}}"
```

→

Output · valid JSON

```
{
  "user": {
    "name": "alice",
    "age": 30
  }
}
```

### F3.2 JSON → String（转义打包）

Input · JSON

```
{
  "msg": "hi\nworld",
  "ok": true
}
```

→

Output · string literal

```
"{\"msg\":\"hi\\nworld\",\"ok\":true}"
```

选项：单 / 双引号包裹切换；高亮 `\n` `\t` 等可视；支持 4 层嵌套转义。

### F3.3 嵌套 Stringified JSON 全量解开

常见于 Golang proto 序列化场景：JSON 字段值本身又是 stringified JSON。一键递归展开为纯 JSON。

Input · proto 风格嵌套

```
{
  "code": 200,
  "data": "{\"name\":\"alice\",\"age\":30}",
  "extra": "{\"tags\":[\"a\",\"b\"]}"
}
```

→

Output · 全量解开

```
{
  "code": 200,
  "data": {
    "name": "alice",
    "age": 30
  },
  "extra": {
    "tags": ["a", "b"]
  }
}
```

策略 ：检测字符串字段能否 `JSON.parse` 成对象 / 数组 → 是则递归展开

无层数限制 ：递归到底；用 超时 而非"拍一个层数"来防失控

超时失败 ：单次解析超过阈值（默认 200 ms，可调）即停，避免死循环 / 巨型嵌套卡 UI

开关 ：可在设置中关闭（Format / Tree 默认启用）

## F4 AI Auto Fix（DeepSeek）

JSON parse 失败时一键调 DeepSeek 修复。按钮 仅在解析失败时显示，无误触。

Input · 非法（多 comma + 单引号 + 无引号 key）

```
{
  name: 'alice',
  age: 30,
  items: ["a", "b",],
}
```

AI

Output · DeepSeek 修复

```
{
  "name": "alice",
  "age": 30,
  "items": ["a", "b"]
}
```

Prompt 策略 ：严格要求「只返回合法 JSON object / array，无解释 / markdown 包裹」；无法修复时返回约定失败 sentinel，Rust 必须把它映射为 `AiInvalidJson`，不能进入 Diff

验证 ：本地 try-parse 验证返回；失败只显示不可用提示，不把原始返回写入日志或暴露为可接受结果

呈现 ：diff 形式展示修复点，用户决定接受 / 撤销

开关 ：可在设置完全关闭，关闭后入口全部隐藏，代码层面零网调

不做客户端节流 ：用户用自己的 API key，是否「省 token」是用户决定；仅透传上游 429（含 retry-after）

## F5 历史记录

本地 SQLite，默认最近 100 条；可搜索、置顶、收藏。裁剪时先保留 pinned，再保留 starred，最后按时间淘汰普通记录。History 按钮或 `⌘Y` 打开本地历史面板；点击条目载入编辑器。路径 `~/Library/Application Support/Jsonita/history.db`。

历史 op-chip 的视觉语义与 token 归 [design/01](../design/01_mockups.md) 和 [design/03](../design/03_design_tokens.md) 管理。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | INTEGER PK | 主键 |
| `created_at` | INTEGER | Unix 时间戳（ms） |
| `content` | TEXT | 完整 JSON 文本 |
| `summary` | TEXT | 前 80 字符 |
| `content_hash` | TEXT | SHA-256，用于去重 |
| `op_type` | TEXT | format / minify / tree / str-to-json / json-to-str / ai-fix |
| `pinned` | INTEGER | 0 / 1 |
| `starred` | INTEGER | 0 / 1 |
| `tags` | TEXT | 预留字段，v1 不暴露 UI |

## F6 全局快捷键

| 动作 | 默认快捷键 | 可自定义 |
| --- | --- | --- |
| 呼出 / 隐藏浮窗 | `⌘⇧J` | 是（全局） |
| 找回上次会话 | `⌘⇧L` | 是（全局可选） |
| 切换单窗 / 双栏 | `⌘\` | 是（窗口内；与全局快捷键同一录入组件，但不走 global-shortcut） |
| 清空输入（ 不 写入「上次」） | `⌘K` | 否 |
| 打开设置 | `⌘,` | 否；右上角设置按钮等效；打开后主卡片内容切到 Settings 页 |
| 非编辑态切换功能 Tab | `Tab` /`⇧Tab` | 否 |
| 关闭 / 退出编辑 | `Esc` ×2 /`⌘W` | 否；编辑器内第一下 `Esc` 先退出 editing，短时间内第二下才隐藏；AI Fix 决策态单次 `Esc` 仍为 Cancel |

权限：快捷键注册失败时给出权限或冲突提示，并提供打开 macOS 隐私设置的恢复入口。v1 不在首次启动强制要求 Accessibility；macOS 13+ 可能在特定环境下提示 Input Monitoring。

冲突检测：录入新快捷键时实时检测系统已占用组合。

## F7 设置面板

设置面板按真实实现拆成 6 个分组：General / Shortcuts / AI / History / JSON Transform / About。Settings 是主壳内 page state，不是遮罩 modal：右上角齿轮、`⌘,` 和 tray Settings 会把主卡片内容从编辑工作区切到设置工作区；Done、`Esc` 或 Settings 页内 `⌘W` 返回编辑工作区。完整交互权威见 [design/02 § 6](../design/02_interaction.md#6-设置面板交互)，组件契约见 [design/04](../design/04_components.md)。

### F7.1 General

General 覆盖语言、主题、开机自启动、失焦隐藏、智能缩放、单窗模式与自动粘贴剪贴板；v1 beta 默认 English，并允许切换简体中文。字段边界见 [A00 schemas](../spec/appendix/A00-schemas.md)，具体控件行为见 [design/02 § 6](../design/02_interaction.md#6-设置面板交互)。

### F7.2 Shortcuts

全局呼出、找回上次会话、窗口内切换单窗 / 双栏均可配置；内置快捷键只读展示，系统保留组合默认阻塞。快捷键交互权威见 [design/07](../design/07_menubar.md)。

### F7.3 AI

AI 分组覆盖 AI Auto Fix 总开关、DeepSeek API key、连接测试、保存与移除；`aiModelId` 使用默认 `deepseek-chat`，当前不暴露独立编辑控件。存储契约见 [A00 schemas](../spec/appendix/A00-schemas.md)，客户端契约见 [M02 AI Repair](../spec/M02-ai-repair.md)，控件行为见 [design/04](../design/04_components.md)。

### F7.4 History

History 分组覆盖历史上限、写入规则与清理策略；持久化规则见 [spec/S05-storage-session.md](../spec/S05-storage-session.md)。

### F7.5 JSON Transform

JSON Transform 分组覆盖嵌套 stringified JSON 自动解开、解析超时阈值与编辑器 soft-wrap。算法契约见 [spec/M01-json-engine.md](../spec/M01-json-engine.md)，控件行为见 [design/02 § 6](../design/02_interaction.md#6-设置面板交互)。

### F7.6 About

About 展示产品名、版本号、License、作者、数据目录、日志目录；GitHub 按钮调用系统浏览器。v1 不内置检查更新。

## F8 会话保留与恢复

合法 transform 成功后保存 last_session；任何时刻 `⌘⇧L` 可手动找回。当前版本不做关闭后自动恢复。

| 场景 | 行为 |
| --- | --- |
| 合法 transform 成功 | 覆盖保存到 sqlite `last_session` |
| 关闭后再次呼出 | 保持当前 WebView store；若应用重启则空白，需手动按 `⌘⇧L` 找回 |
| 应用 Quit 重启 | 默认空白；按 `⌘⇧L` 仍可找回（sqlite 持久化） |
| 按 `⌘⇧L` （任意时刻） | 先显示 / 聚焦浮窗，再从 sqlite `last_session` 读取并载入 |
| 按 `⌘K` 主动清空 | 立即清空 + 不 写入「上次会话」（避免找回的是空） |

实现要点：

transform 成功时写 sqlite `last_session` 单行表（覆盖式）

`⌘⇧L` 始终从 `last_session` 读取

`⌘K` 同时清空编辑器与 `last_session` ，避免找回空白

设置项 （General 分组）： `restoreWindow` 字段保留，当前版本不驱动自动恢复 UI。

## F9 单窗模式 (Single-pane Mode)

可选模式：默认是左右双栏（input | output）对比；开启后取消右侧 output 面板，主区域只承载一个工作视图。交互权威见 [design/02 § 6.1](../design/02_interaction.md#6.1-single-pane-status-controls) 与 [design/02 § 6.2](../design/02_interaction.md#6.2-single-pane-run-hint)。

适用场景：屏幕小、希望只保留输入区域。历史与会话写入规则仍按 F5 / F8 / [spec/S05-storage-session.md](../spec/S05-storage-session.md) 执行。

## F10 浮窗智能缩放

4 层独立逻辑，共同决定浮窗在任意时刻的宽高。 原则：克制，最大不占满屏；初次打开也不能太小。

| 层 | 触发 | 行为 | 用户可控？ |
| --- | --- | --- | --- |
| 1. 首次呼出尺寸 | 新光标屏第一次呼出 / 用户从未拖动过 | 固定 860 px（tauri.conf 与 window.json 默认）；高度 560 px | `settings.initialWidth` 字段保留，当前 UI 未渲染，也不影响启动尺寸 |
| 2. 内容动态缩放 | 粘贴、编辑、字体缩放 → 行长 / 行数 / 字号 / soft-wrap | 评估理想宽高；宽度由可见列数决定，高度由行数 × 行高决定；软换行开时宽度保守但仍可增高 | 设置 General「智能缩放」总开关；交互权威见 [design/02 § 6](../design/02_interaction.md#6-设置面板交互) |
| 3. 手动拖边缩放 | 用户从窗口边缘拖动 resize | 记忆到 `window.json`；作为下次呼出基准，并暂停内容驱动自动缩放，直到重置尺寸 | 始终可拖；不可关闭 |
| 4. soft-wrap | 编辑器内长行 | 开启时长行换行不溢出，关闭时按实际最长行估算宽度 | 归 F1 编辑器交互与 [design/08](../design/08_editor.md) 管理 |

克制原则的具体数字：

min 宽度 ：600 px（双栏）/ 440 px（单窗）── 放宽下限让字号 / 内容能真正驱动窗口

max 宽度 ：min(1400 px, 当前屏宽 × 70%) ── 13 寸屏 ≈ 1440 × 0.7 = 1008 px；27 寸屏 ≈ 2560 × 0.7 = 1792 px 但被 1400 上限封顶

min 高度 ：360 px

max 高度 ：min(900 px, 屏高 × 72%) ── 防止占满并保持浮窗感

字号变化参与动态缩放计算；具体快捷键、浮窗 chrome 跟随范围与上限见 [design/02 § 1.1](../design/02_interaction.md#1.1-tab-切换) 与 [design/03](../design/03_design_tokens.md)。

层 2 与层 3 的关系：

用户从未拖边缩放 → 每次内容 / 字号变化都重新评估理想宽高（层 2 主导）

用户一旦拖边缩放 → 用户尺寸"粘住"， 不再 因内容变化自动变（层 3 锁定）

重置：当前无 Settings 入口；内部 `window_reset_size` command 仍可清掉 `window.json` → 回到层 1+2 行为

非常用场景：

多屏切换：屏宽变化时按新屏重新评估 max；不缩小用户拖动的尺寸（除非已超新屏 max）

用户把浮窗拖出 max 限制（如设 1600 px）：允许；记忆原样

极大 JSON（> 100 KB）：仍受 min/max 限制；用户可通过手动 resize 锁定尺寸
