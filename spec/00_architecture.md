SPEC · 章节 00

# 系统架构

进程模型、模块边界、数据流、错误传播 ── 用图与表建立系统心智模型，开发者从此入手。

INFO

整套架构在 [plan/03 技术选型](../plan/03_tech_stack.md) 已锁定（Tauri 2 / React / SQLite / 本地 secrets.json）。本章描述 如何组合，不再讨论选型；数据契约见 [13 § 1-3](13_schemas.md)，IPC 合约见 [02](02_ipc.md)。

一 · 设计

## 1系统全景

Jsonita 是一个 双进程 桌面应用：Rust 主进程承载所有系统能力（菜单栏 / 全局快捷键 / SQLite / 本地 secrets.json / HTTP），WebView 渲染进程承载 UI（React + CodeMirror）。两者通过 Tauri IPC pipe 通信， WebView 进程绝对不直接访问 fs / net / clipboard / secrets。

系统全景由以下边界组成：

| 边界 | 承载 | 可访问资源 | 通信规则 |

| --- | --- | --- | --- |

| 用户输入设备 | 键盘 `⌘⇧J`、菜单栏 tray、鼠标 / 触控板 | 无持久资源 | 只触发 system 层事件或 WebView UI 事件 |

| Rust 主进程（host，常驻 ≤ 40 MB） | `system`、`commands`、`engine`、`store`、`ai` | SQLite `history.db`、`secrets.json`、`settings.json`、`window.json`、DeepSeek HTTPS | 通过 Tauri commands + events 暴露能力 |

| Tauri IPC pipe | 类型化 `invoke` + `listen` | 无直接资源 | WebView 和 Rust 的唯一跨进程通道 |

| WebView 进程（浮窗，~80 MB） | `FloatingWindow`、`TabBar`、`StatusBar`、功能 panes、CodeMirror 6、JSON Tree、zustand store、IPC client | 只持有内存态 UI state | 不直接读写 fs / net / clipboard / secrets |

| 外部资源 | SQLite、`secrets.json`、JSON store、DeepSeek API | 由 Rust 端独占访问 | WebView 必须经 IPC 间接访问 |

### 1.1六层职责

| 层 | 位置 | 承载 | 边界硬约束 |

| --- | --- | --- | --- |

| 表现层 | WebView | 浮窗 UI / 设置面板 / 状态栏 / AI 面板 | 不直访 fs / net / clipboard |

| 逻辑层 | WebView | 编辑器状态机、UI store、IPC 客户端 | 调 Tauri command / listen event；不持有持久数据 |

| IPC 层 | 跨进程 | commands / events 合约 | 序列化经 serde_json；payload < 4 MB |

| 领域层 | Rust | JSON 引擎、AI 调度、设置、会话、历史 | 纯函数优先；不持有 Tauri runtime context |

| 系统层 | Rust | 菜单栏、全局快捷键、窗口、剪贴板、权限 | macOS / Windows 抽象不同 ── 平台 cfg |

| 持久化 | Rust | history.db / settings.json / secrets.json | 仅 Rust 端访问；前端走 IPC |

## 2进程模型与内存预算

启动后常驻 1 个主进程 （Tauri host）+ 1 个 WebView 进程 （浮窗）。无 worker 子进程（v1）。

| 进程 | 启动 | 退出 | 常驻目标 |

| --- | --- | --- | --- |

| Rust host | 开机自启动 / 用户首次启动 | 菜单栏 Quit /`⌘Q` | ≤ 40 MB（无浮窗时） |

| WebView 浮窗 | `⌘⇧J` / tray 点击 | 非编辑态连续两次 `Esc` / 失焦 /`⌘W` = hide 不 close；编辑态 `Esc` 先 blur；进程保留 | ≤ 80 MB（含编辑器空闲） |

WARN

浮窗 常驻不销毁，关闭只是 `window.hide()`，DOM 保留在内存。这换来呼出 < 500 ms 的首屏体验，代价是 ~80 MB 稳态内存 ── 与 [04 NFR § 1](../plan/04_nfr.md) 锁定的目标对齐。

### 2.1进程生命周期

| 状态 | 进入条件 | 行为 | 退出条件 |

| --- | --- | --- | --- |

| Bootstrapping | `launchd` 或用户首次启动 | 初始化 tokio、SQLite、settings、tray、shortcuts，并预建 hidden WebView | 初始化完成 |

| Ready | Rust host 与 WebView 都已存活，WebView hidden | 保留进程以加速呼出 | `⌘⇧J` 或 tray click |

| Visible | `window.show` 后 | WebView visible，用户可交互 | 编辑态 `Esc` 先 blur；非编辑态双击 `Esc`、失焦或 `⌘W` hide |

| Quitting | `⌘Q` 或 Tray Quit | emit `app:will_quit`，保存最后一次 session | 进程退出 |

## 3关键不变量

下面 6 条是 所有新代码必须遵守 的硬规则。违反通常会导致状态不一致、数据丢失或安全风险。

| 不变量 | 规则 | 违反后果 |

| --- | --- | --- |

| I-1 单一数据源 | 浮窗内容只存在 React 编辑器 state；合法 transform 成功时落 sqlite last_session；手动恢复从 sqlite 读 | 恢复后内容与用户输入不一致 |

| I-2 设置项单源 | 所有可配置项以 Rust 端 `SettingsStore` 为准；前端启动 load + 监听 `settings:changed` | 设置生效延迟 / 多窗口不同步 |

| I-3 错误不藏 | 所有 IPC 错误必须携带可供调用方呈现的结构化信息，不允许 silent fail | 用户看不到为什么操作没反应 |

| I-4 main 进程不阻塞 | 所有 IO（SQLite / HTTP / secrets fs）走 `tokio::spawn_blocking` 或 async client | 菜单栏 / 快捷键 / 窗口卡顿 |

| I-5 UI 不直访 fs/net | WebView 不开 `fs` /`http` allowlist；所有外部 IO 走 commands | WebView 漏洞可读用户文件 / 偷 API key |

| I-6 AI 完全可关 | `settings.ai_enabled = false` 时 UI Tab 隐藏 + Rust early return ── 双重保险 | 用户关了 AI 仍出网 |

二 · 工作机制

## 4启动时序（< 500 ms 就绪）

从 launchd 拉起到 WebView 待命的全过程。 关键设计：浮窗在启动末尾就 hidden-built，呼出时只需 `window.show()` （亚毫秒）。

启动时序：

1. `launchd` 拉起 `Jsonita.app`（T+0）。
2. Rust main 启动 tokio runtime 并初始化日志（T+~120 ms）。
3. system/store 层打开 `history.db` 并执行 migration。
4. SQLite 返回 ok。
5. `SettingsStore::load(settings.json)` 读取设置。
6. `tray::build` 与 `shortcuts::register_defaults` 注册系统入口。
7. system 层返回 ok。
8. `WebViewWindowBuilder.build({ visible: false })` 预建 WebView。
9. WebView window created。
10. macOS 下执行 `promote_to_nspanel(win)`。
11. 注册 close intercept。
12. T+~500 ms：WebView DOM 就绪，hidden 待呼出。

预算分配：tokio 启动 ~120 ms · SQLite open + migrate ~60 ms · tray + shortcuts 注册 ~40 ms · WebView 预建 ~280 ms ≈ 500 ms。其中 WebView 预建占大头 ── 是为了 trade off 呼出延迟。

## 5呼出时序（< 500 ms P95）

呼出时序：

1. 用户按 `⌘⇧J`。
2. GlobalShortcut handler triggered（T+0）。
3. Rust host 调 `cursor_position()` 找鼠标所在屏（T+~10 ms）。
4. Tauri Window 执行 `set_position(光标屏中央偏上 1/3)`。
5. Tauri Window 执行 `show()` + `set_focus()`（T+~80 ms）。
6. Window 返回 ok。
7. WebView 已预热，React 保持当前 store 状态。
8. 用户可交互；稳态总耗时约 T+~250 ms，P95 < 500 ms。

预算：shortcut handler 20 ms · 光标屏定位 30 ms · window.show/focus 80 ms · WebView 已驻留 ≈ 250 ms 稳态。

## 6典型数据流：format JSON

用户在编辑器粘贴 JSON → 自动格式化。展示 React store → IPC → Rust engine 的链路与 debounce 节流策略。

format JSON 数据流：

1. 用户粘贴或输入 JSON。
2. CodeMirror 触发 `onChange(text)`。
3. editor store debounce 300 ms，合并连续 onChange，并生成 `requestSeq`。
4. ipc client 调 `invoke("json_format", { text, opts })`。
5. `cmds::json_ops::json_format(text, opts)` 作为 async command 接收请求。
6. CPU 密集解析/格式化进入 `spawn_blocking`。
7. `engine::json::format(text, opts)` 返回结果。

成功分支：

1. Rust 返回 `Ok(formatted)`。
2. ipc client 把 `Ok(formatted)` 交回 editor store。
3. 如果 `requestSeq` 不是最新，前端丢弃结果。
4. 最新结果解析成功后执行 `setOutput(formatted)`。
5. 前端状态更新为 valid；可见呈现见 [design/02 § 5](../design/02_interaction.md#5状态指示)。

Parse 失败分支：

1. engine 返回 `Err(Parse { line, col, msg })`。
2. command 映射为 `Err(JsonitaError::Parse)`。
3. 如果 `requestSeq` 不是最新，前端丢弃错误。
4. 最新错误执行 `setError({ line, col, msg })`。
5. 前端状态保存 `line:col` 错误位置；可见呈现见 [design/02 § 5](../design/02_interaction.md#5状态指示)。
6. `showAiFix = true`。

## 7错误传播模型

所有 Rust 错误统一映射到单一 `JsonitaError` enum（9 个变体，完整定义见 [13 § 1](13_schemas.md) ），经 serde 序列化跨 IPC 边界传到前端，由前端按 [design/02 § 5.1](../design/02_interaction.md#5.1错误呈现矩阵) 呈现。

| 错误源头 | `JsonitaError` 变体 | 典型 payload | 调用方要求 |

| --- | --- | --- | --- |

| `serde_json` parse | `Parse` | `line` / `col` / `msg` | 保留精确位置 |

| unwrap 超时 | `UnwrapTimeout` | timeout / depth 信息 | 保留超时上下文 |

| `rusqlite` | `Sqlite` | database error | 保留数据库错误摘要 |

| `secrets.json` | `Secrets` | fs / permission error | 保留操作与权限上下文 |

| `reqwest` / DeepSeek | `Http` / `RateLimit` | status / body / retry-after | 透传 HTTP 状态与 retry-after |

| AI 输出无法验证 | `AiInvalidJson` | raw output | 保留 raw 且禁止覆盖原输入 |

设计原则： Rust 不"产品化"错误 （不翻译中文、不加 emoji），UI 层按 `kind` 和 payload 决定如何展示给用户。

三 · 模块组织

## 8Rust 端模块依赖

采用 单 crate + 模块化 结构（不拆 workspace；v2 跨平台或体量爆炸再拆）。依赖严格分层 ── 上层调下层， 同层不互调。

Rust 端依赖方向：

| 层级 | 模块 | 职责 |

| --- | --- | --- |

| 装配层 | `main.rs` | `tauri::Builder` 装配 commands 与插件 |

| 协调层 | `commands/` | IPC handlers；每组一文件：json_ops、history、session、settings、ai、window、system |

| 领域层 | `engine/` | json、unwrap、stringify、error_loc；纯函数，可独立单测 |

| 持久化层 | `store/` | db、history、session、settings；SQLite + JSON files |

| 外网层 | `ai/` | deepseek、prompt、validate；reqwest HTTP |

| 系统层 | `system/` | tray、shortcuts、window_panel、secrets；平台 cfg 抽象 |

| 错误层 | `error.rs` | `JsonitaError` |

| 模块 | 对外接口 | 关键依赖 |

| --- | --- | --- |

| `commands/` | 20+ Tauri command handlers（见 [02 § 6](02_ipc.md) ） | engine / store / ai / system |

| `engine/` | `format / minify / unwrap / json_to_string / string_to_json` 5 个纯函数（ [09](09_json_engine.md) ） | serde_json |

| `store/` | `Db / SettingsStore / secrets` + history/session CRUD（ [10](10_storage.md) ） | rusqlite + r2d2 + JSON files |

| `ai/` | `fix / test_connection` （ [11](11_ai_client.md) ） | reqwest + secrets store（读） |

| `system/` | tray + shortcuts + NSPanel + secrets store（ [06](../design/06_window.md) ·[07](../design/07_menubar.md) ） | tauri-plugin-* + cocoa（macOS） |

| `error.rs` | `JsonitaError` （ [13 § 1](13_schemas.md) ） | thiserror + serde |

## 9TypeScript 端模块结构

前端分层规则： UI 不直接调 IPC ── panes / editor / tree 只读 store，调用通过 store actions 间接发起 IPC。这样切实现 / mock 测试时不动 UI。

TypeScript 端依赖方向：

| 层级 | 模块 | 职责 |

| --- | --- | --- |

| 入口 | `App.tsx` | 顶级路由与全局 modal 挂载 |

| 壳层 | `shell/` | `FloatingWindow`、`TabBar`、`StatusBar` |

| 功能层 | `settings/`、`history/`、`panes/`、`editor/`、`tree/` | 设置、历史、Format / Minify / Tree / Str↔JSON / AiFix、CodeMirror、JSON 树 |

| 状态层 | `store/` | zustand store：editor、ui、settings、ai |

| 通信层 | `ipc/` | 类型化 invoke + listen：`events.ts` + `commands.ts` |

| 类型层 | `types/` | 13 章数据模型镜像 |

| 目录 | 职责 | 典型文件 |

| --- | --- | --- |

| `shell/` | 浮窗壳 + 全局 UI（TabBar / 状态栏） | FloatingWindow.tsx · TabBar.tsx · StatusBar.tsx |

| `panes/` | 5 个功能面板 | FormatPane · MinifyPane · TreePane · Str↔JSON · AiFixPane |

| `editor/` | CodeMirror 6 封装 + linter + theme | Editor.tsx · extensions.ts · lint.ts · theme.ts |

| `tree/` | JSON 树视图 + path / hover 复制 | TreeView.tsx · jsonpath.ts |

| `settings/` | 设置 Modal + 6 个分组面板 | SettingsModal · General · Shortcuts · Ai · History · JsonTransform · About |

| `history/` | 保留目录；历史 Modal UI 当前未实现 | — |

| `store/` | zustand store（4 个域） | editor.ts · ui.ts · settings.ts · ai.ts |

| `ipc/` | 类型化 invoke / listen wrapper | commands.ts · events.ts · error.ts |

| `types/` | 与 Rust 镜像（13 章导出） | commands.ts · events.ts · enums.ts · error.ts |

## 10项目根目录

仅展示 顶层结构；子目录详情见对应章节。

| 路径 | 内容 | 详见 |

| --- | --- | --- |

| `PROJECT.md / README.md / TODO.md / CHANGELIST.md` | 文档入口与项目元数据 | — |

| `assets/` | 设计素材与应用图标全套 | [05](../design/05_icons_theme.md) |

| `plan/` | 产品计划、功能范围、技术选型与非功能约束 | [plan/](../plan/00_overview.md) |

| `spec/` | 技术规格（本目录） | — |

| `src/` | React 前端（见 § 9） | 各章节 |

| `src-tauri/` | Rust 后端（见 § 8）+ `tauri.conf.json` + `migrations/` + bundle icons | [06](../design/06_window.md) ·[12](12_packaging.md) |

| `package.json · tsconfig · tailwind.config · vite.config` | 构建配置 | [03](../design/03_design_tokens.md) |
