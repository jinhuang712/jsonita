SPEC · 章节 02

# IPC 合约

Rust ↔ React 通信契约 ── 先讲设计意图与工作机制，再列签名速查。所有 payload 数据模型见 [13 数据模型参考](13_schemas.md)。

REF

本章描述 调用契约 与 工作机制； 所有 struct / enum / payload 字段定义 统一在 [13 § 1-3](13_schemas.md)，本章只链 § N，不重复定义。

一 · 设计

## 1设计目标与边界

IPC 在 Jsonita 里同时承担三个角色： 权限边界 （控制 React 能做什么）、 类型契约 （Rust 与 TS 双向类型一致）、 性能护栏 （CPU 与 IO 在 Rust 端集中调度）。

唯一通道 ：React 不允许绕过 Rust 访问 SQLite / secrets / 系统快捷键 / Finder ── 不仅是约定，Tauri 默认关掉了 WebView 对应能力

类型契约 ：Rust 端 enum/struct 通过 serde 序列化为 JSON 跨进程；TS 端镜像同名 interface，编译期捕捉签名漂移（v1 手工镜像，体量上来再换 ts-rs）

关注的事 ：状态修改（SQLite / secrets / 设置）/ 系统调用（快捷键 / 剪贴板 / Finder）/ 外网请求（DeepSeek）/ 窗口管理

不关注的事 ：纯 UI 渲染（mermaid 图、CodeMirror 内部操作）、DOM/CSS、前端路由 ── WebView 内部处理，不消耗 IPC 信道

为何不用 HTTP / WebSocket：Tauri 内置 `invoke` 走 IPC pipe（同进程消息队列），单次序列化 + 直接进程内传递。HTTP 需要本地端口（macOS 防火墙弹窗 / 端口冲突）+ 两次序列化（请求 JSON / 响应 JSON）+ 鉴权层 ── 单进程桌面应用没必要付这些税。

## 2命令分组与职责

所有 IPC 命令按 资源归属 切分为 7 组，每组对应一个 Rust 模块（ `src-tauri/src/cmds/{json,history,session,settings,ai,window,system}.rs` ）。这种切分的好处是 "谁能写谁不能写" grep 一下模块就清楚，避免出现"utils.rs 里写跨领域操作"的灰色地带。

| 分组 | 关注领域 | 状态归属 | 典型副作用 |

| --- | --- | --- | --- |

| json_ops | 纯计算（format / minify / unwrap / stringify） | 无状态 | 无 |

| history | SQLite `history` 表 + FTS5 索引 | SQLite | 命令返回最新行；当前不 emit history 事件 |

| session | SQLite `last_session` 单行 | SQLite | transform 成功写入； `⌘⇧L` 读取； `⌘K` 清空 |

| settings | 自写 JSON 文件 Store | JSON 文件 + 内存缓存 | 写入后 emit `settings:changed` |

| ai | DeepSeek HTTP + secrets 读 | secrets.json | 外网调用；前端用本地 loading 状态展示进度 |

| window | NSPanel 状态 + 智能缩放记忆 | window.json + 内存 flag | show / hide / resize UI 动作 + emit `window:resized` |

| system | 全局快捷键 / 剪贴板 / 日志路径 | 系统级注册表 | 注册 / 释放快捷键 / Finder reveal |

分组的硬约束：

命令 不能跨分组直接读写状态 。例： `history_*` 不直接读 `last_session` 表；需要联动则由前端按命令返回值更新对应 store

纯计算分组（json_ops） 不持有任何状态 ，可任意并发 ── 默认在 CPU 池 `spawn_blocking` 跑

外网分组（ai） 不写 SQLite ，只读 secrets.json；命令返回后由前端决定是否落历史。这样 ai 模块可以被替换（换成 OpenAI / Claude）而不影响历史模型

window 分组 不感知业务（不知道有 JSON / 历史 / AI），只接收 React 推来的 ContentMetrics 算尺寸 ── 这样窗口逻辑可独立测试

## 3错误传播模型

所有 command 返回 `Result<T, JsonitaError>`， `JsonitaError` 是 全局单一错误 enum （定义见 [13 § 1](13_schemas.md)，9 个变体）。

### 3.1为什么是单一 enum 而不是 anyhow / 每模块自带 Error

前端只需一个类型守卫 ： `parseJsonitaError(e)` 返回 discriminated union，TS exhaustive switch 静态保证覆盖所有 kind ── 漏处理一个变体编译报错

调用点可穷尽处理 ：当前实现用 `isJsonitaError(e)` 在各调用点按场景分派；统一 `handleIpcError` 是保留目标

跨 IPC 不丢类型 ： `anyhow::Error` 跨进程会退化为 String；自定义 enum 通过 serde tag/content 保留 enum + payload 结构

变体可控（9 个，不爆炸） ：每加一个变体都要权衡是否真的需要分类，强制保持错误"扁平"易处理

### 3.2跨 IPC 边界的序列化形态

Rust 端 enum 加 `#[serde(tag = "kind", content = "data")]`，序列化为对象而非 Rust adjacent 风格：

```

// Rust enum 变体：JsonitaError::Parse { line: 3, col: 12, msg: "..." }
//   ↓ serde
// 跨 IPC JSON：    { "kind": "Parse", "data": { "line": 3, "col": 12, "msg": "..." } }
//   ↓ Tauri invoke reject
// TS 端拿到：       { kind: 'Parse', data: { line, col, msg } }

```

TS 端统一拦截：

```

// src/ipc/error.ts
export function isJsonitaError(e: unknown): e is JsonitaError {
  return typeof e === 'object' && e !== null && 'kind' in e;
}

// 调用点：
try { return await invoke('json_format', { text, opts }); }
catch (e) {
  if (isJsonitaError(e)) {
    // 当前按调用场景分派：Parse、AI、settings 等调用点分别处理
    return handleCommandError(e);
  }
  throw e; // Tauri 自身错误（如反序列化失败）
}

```

### 3.3调用方处理原则

错误按"调用方能否继续当前流程"分 3 类（完整 kind × command 映射见 § 8）：

可恢复：如 `Parse` / `UnwrapTimeout`，保留错误上下文并允许继续编辑

可重试：如 `Http` / `RateLimit`，保留 status / retry-after 供调用方决定重试节奏

阻断：如 `AiInvalidJson` / `Secrets`，调用方不得覆盖原输入，必须保留 raw 或操作上下文

## 4命名、同步语义、幂等、大小

这些是 所有命令必须遵守的横向规则，写新命令时核对一遍。

| 维度 | 规则 | 原因 |

| --- | --- | --- |

| 命令命名 | snake_case，如 `json_format` | Rust 风格；invoke 字符串直接对应函数名 |

| 事件命名 | namespace:name，如 `settings:changed` | 方便前端按 prefix 过滤监听 / 调试 |

| Rust struct 字段 | snake_case | Rust 风格 |

| JSON / TS 字段 | camelCase | JS/TS 风格；通过 `#[serde(rename_all = "camelCase")]` 自动转换（统一规则见 [13 § 7](13_schemas.md) ） |

| 同步语义 | 所有 command 一律 `async` | 前端永远 `await invoke()`；CPU 密集内部走 `spawn_blocking` |

| 幂等性 | read 全幂等；write 通过 `request_id` （UUID v4）去重 ── v1 仅 `ai_fix` 用 | 双击 / 重试不重复扣 token |

| 大小上限 | payload < 4 MB | Tauri IPC 单次序列化上限；超出预留 event 流式分块（v1 未触发） |

| 类型同步 | 改 Rust struct → 同步改 `src/types/*.ts` + 13 § N 字段表 → PR 模板复选框检查 | v1 手工，详流程见 [13 § 8](13_schemas.md) |

二 · 工作机制

## 5关键时序

三条时序覆盖最容易实现错的链路，是理解上面分组职责的最佳入口。文档不保留交互式图卡；实现时按下面的参与方、步骤与分支核对。

### 5.1呼出（快捷键路径）

从 `⌘⇧J` 按下到窗口显示。关键点： 定位算法在 Rust 端完成 （多屏感知），窗口定位后再 show → 避免闪烁。

参与方：用户、GlobalShortcut、Rust host、Tauri Window。

步骤：

1. 用户按 `⌘⇧J`。
2. GlobalShortcut 触发 handler。
3. Rust host 调 `cursor_position()` 找鼠标所在屏。
4. Rust host 请求 Tauri Window `set_position(center, top 1/3)`。
5. Rust host 请求 Tauri Window `show()` + `set_focus()`。
6. Tauri Window 返回 ok。
7. WebView 已预热，React 保持当前 store 状态。

预算：总耗时 P95 < 500 ms（已驻留 WebView）。

### 5.2AI Fix（含错误透传）

AI Fix 由前端本地 loading 状态驱动；IPC 层只负责返回结构化成功 / 失败 payload，具体 UI 呈现见 [design/02 § 4](../design/02_interaction.md#4ai-fix-流程仅错误时) 与 [design/02 § 5.1](../design/02_interaction.md#5.1错误呈现矩阵)。

参与方：用户、React UI、`ai_store`、Rust `ai_fix` command、`secrets.json`、DeepSeek API。

基础步骤：

1. 用户点击 AI Fix。
2. React UI 调 `startFix(text, errorLoc)`。
3. `ai_store` 调 `invoke ai_fix(req)`。
4. Rust `ai_fix` 从 `secrets.json` 读取 `deepseek_api_key`。
5. `secrets.json` 返回 api key。
6. Rust `ai_fix` 执行 `build_prompt(text, line, col, msg)`。
7. Rust `ai_fix` 调 DeepSeek `POST /v1/chat/completions`。

成功分支：

1. DeepSeek 返回 `{ fixed JSON }`。
2. Rust `ai_fix` 用 `serde_json::from_str` 验证。
3. 验证通过后返回 `Ok(AiFixResp)`。
4. React UI 渲染 DiffView。
5. 用户 Accept 时执行 `editor.setContent` + `history_add`。
6. 用户 Cancel 时执行 `discard()`。

失败分支：

| 条件 | Rust 返回 | 调用方契约 |

| --- | --- | --- |

| 验证失败 | `Err(AiInvalidJson, raw)` | 保留 raw，交给调用方决定展示 / 反馈 |

| DeepSeek 429 + `Retry-After` | `Err(RateLimit, retryAfterSec)` | 透传 retry-after |

| 其他 HTTP 状态 | `Err(Http, status, body)` | 透传 status / body 摘要 |

### 5.3关闭浮窗 → 保留会话

当前实现中，合法输入在 transform 成功时通过 `session_save_last` 持久化；关闭路径只负责退出 editing 或隐藏窗口，避免无效 / 空白内容覆盖 last_session。

参与方：用户、React UI、Rust host。

分支规则：

| 条件 | 步骤 | 结果 |

| --- | --- | --- |

| 焦点在 CodeMirror / 表单输入内 | 用户按 `Esc`，React 执行 `activeElement.blur()` | 不调用 IPC |

| 非 editing 连续两次 `Esc` 或 `⌘W` | React 调 `invoke window_hide()`，Rust host 执行 `window.hide()` | WebView hidden，进程保留 |

| 失焦且 `hideOnBlur=true` | Rust host 执行 `window.hide()` | WebView hidden，进程保留 |

三 · 契约速查（schema 区）

## 6Commands 总表

速查表 ── 当前实现的 29 个命令按 7 组排列。所有命令返回 `Result<T, JsonitaError>` 或等价前端可消费结果；幂等列「✓」表示同样输入多次调用结果一致且无副作用。

| 分组 | 命令 | 幂等 | P95 耗时 | 描述 |

| --- | --- | --- | --- | --- |

| json_ops | `json_format` | ✓ | < 50 ms | 格式化（缩进 / sort_keys / minify） |

| `json_minify` | ✓ | < 30 ms | 压缩为单行 |  |

| `json_unwrap_stringified` | ✓ | < 200 ms | 递归解开嵌套 stringified JSON（含超时） |  |

| `json_stringify` | ✓ | < 20 ms | JSON → 转义字符串字面量 |  |

| `json_parse` | ✓ | < 20 ms | 转义字符串字面量 → JSON 文本 |  |

| history | `history_list` | ✓ | < 30 ms | 分页 + 排序（pinned 优先） |

| `history_search` | ✓ | < 30 ms | 子串匹配 content / summary；历史上限小，优先直觉搜索 |  |

| `history_pin` | — | < 10 ms | 置顶 / 取消 |  |

| `history_star` | — | < 10 ms | 收藏 / 取消 |  |

| `history_clear` | — | < 50 ms | 一键清空（不删 pinned / starred） |  |

| `history_add` | — | < 20 ms | 写入历史并按 settings.historyLimit 裁剪 |  |

| session | `session_save_last` | — | < 10 ms | 覆盖式写 last_session |

| `session_load_last` | ✓ | < 10 ms | 读 last_session |  |

| `session_clear_last` | — | < 10 ms | 清空 last_session（⌘K 触发） |  |

| settings | `settings_get_all` | ✓ | < 10 ms | 读全量设置 |

| `settings_set` | — | < 20 ms | 按 key 写；触发 `settings:changed` 事件 |  |

| `settings_reset` | — | < 20 ms | 恢复出厂；触发 `settings:changed` |  |

| ai | `ai_fix` | — | P50 3 s / P95 8 s | 调 DeepSeek 修复 JSON |

| `ai_test_connection` | — | < 3 s | 测 API key + 模型可用 |  |

| `ai_set_api_key` | — | < 50 ms | 写 secrets.json（masked 显示前端） |  |

| `ai_delete_api_key` | — | < 50 ms | 删除 secrets.json 中的 API key |  |

| `ai_has_api_key` | ✓ | < 10 ms | 只返回是否已保存 key，不返回明文 |  |

| window | `window_show` | — | < 200 ms | 显示浮窗 + focus（不重新定位） |

| `window_hide` | — | < 100 ms | 隐藏浮窗（保持进程） |  |

| `window_toggle` | — | < 200 ms | show / hide 切换 |  |

| `window_resize_for_content` | — | < 50 ms | 按内容 / 字号智能缩放（详见 plan F10 / 06 § 7） |  |

| `window_reset_size` | — | < 10 ms | 清掉 window.json 记忆，下次呼出回默认 |  |

| system | `shortcut_register` | — | < 50 ms | 注册新快捷键（检测冲突） |

| `shortcut_status` | ✓ | < 10 ms | 检查 toggle shortcut 是否已注册成功 |  |

| `shortcut_retry` | — | < 50 ms | 重新注册默认快捷键，用于权限授予后轮询 |  |

| `open_accessibility_settings` | — | < 50 ms | 打开 macOS Accessibility 设置页 |  |

| `clipboard_read` | — | < 20 ms | 读剪贴板 + JSON sniff |  |

| `open_log_dir` | — | < 50 ms | Finder 打开 ~/Library/Logs/Jsonita/ |  |

| `open_db_path` | — | < 50 ms | Finder 打开 history.db 所在目录 |  |

| `quit_app` | — | — | 正常退出（不弹确认） |  |

## 6.1命令签名（按分组）

每个签名一行 + 参数类型链接到 13 § N。命名约定见 § 4。

### 6.1.1json_ops

| 命令 | 返回 | opts schema |

| --- | --- | --- |

| `json_format(text, opts)` | `String` | [13 § 3.1 FormatOpts](13_schemas.md) |

| `json_minify(text)` | `String` | — |

| `json_unwrap_stringified(text, opts)` | `String` | [13 § 3.1 UnwrapOpts](13_schemas.md) |

| `json_stringify(text, opts)` | `String` | [13 § 3.1 StringifyOpts](13_schemas.md) |

| `json_parse(text)` | `String` | 输入为 JSON 字符串字面量 |

错误分支： `json_unwrap_stringified` 可能 `UnwrapTimeout`；其余通常 `Parse`。

### 6.1.2history

| 命令 | 返回 | 参数 schema |

| --- | --- | --- |

| `history_list(opts)` | `Vec<HistoryRow>` | [13 § 3.2 ListOpts / HistoryRow](13_schemas.md) |

| `history_search(query, limit)` | `Vec<HistoryRow>` | content / summary 子串匹配 |

| `history_pin(id, pinned)` | `()` | — |

| `history_star(id, starred)` | `()` | — |

| `history_clear()` | `u32` | 返回删除条数（不删 pinned / starred） |

| `history_add(content, opType)` | `HistoryRow` | 写入历史并按 historyLimit 裁剪 |

### 6.1.3session

| 命令 | 返回 | 参数 schema |

| --- | --- | --- |

| `session_save_last(s)` | `()` | [13 § 3.2 LastSession](13_schemas.md) |

| `session_load_last()` | `Option<LastSession>` | — |

| `session_clear_last()` | `()` | ⌘K 触发 |

### 6.1.4settings

| 命令 | 返回 | 说明 |

| --- | --- | --- |

| `settings_get_all()` | `Settings` | 全量字段见 [13 § 3.3](13_schemas.md) |

| `settings_set(patch)` | `Settings` | patch 为 partial JSON 对象；副作用：emit `settings:changed` |

| `settings_reset()` | `Settings` | 恢复出厂；副作用同上 |

### 6.1.5ai

| 命令 | 返回 | 参数 schema | 错误分支 |

| --- | --- | --- | --- |

| `ai_fix(req)` | `AiFixResp` | [13 § 3.4 AiFixReq / Resp](13_schemas.md) | Http / RateLimit / AiInvalidJson / AiDisabled / Secrets |

| `ai_test_connection(apiKey, modelId)` | `TestConnectionResp` | [13 § 3.4](13_schemas.md)；apiKey 直接传，不入 secrets.json | Http / RateLimit |

| `ai_set_api_key(apiKey)` | `()` | 明文 → secrets.json（chmod 600） | Secrets |

| `ai_delete_api_key()` | `()` | 删除保存的 key | Secrets |

| `ai_has_api_key()` | `bool` | 只返回是否存在 key | Secrets |

### 6.1.6window

| 命令 | 返回 | 参数 / 说明 |

| --- | --- | --- |

| `window_show()` | `()` | 显示浮窗 + focus；定位由 shortcut / tray toggle 路径负责 |

| `window_hide()` | `()` | — |

| `window_toggle()` | `()` | show / hide 切换 |

| `window_resize_for_content(metrics)` | `(u32, u32)` | metrics: [13 § 3.5 ContentMetrics](13_schemas.md)；按内容行长 / 行数 / 字号动态缩放，算法 [06 § 7](../design/06_window.md) |

| `window_reset_size()` | `()` | 清掉 window.json 记忆，下次呼出回默认 |

| `window_set_theme(mode)` | `"light" \| "dark"` | mode: "light" \| "dark" \| "system"；让原生 vibrancy 材质 + NSWindow appearance 跟随主题（ [06 § 2.6](../design/06_window.md) ）；system 由原生读 `NSApp.effectiveAppearance` 解析并回传 effective theme 给前端作权威值 |

### 6.1.7system

| 命令 | 返回 | 参数 schema |

| --- | --- | --- |

| `shortcut_register(req)` | `ShortcutRegisterResp` | resp = `Ok` \| `Conflict { withApp? }` \| `Reserved` \| `InvalidAccelerator { reason }` |

| `shortcut_status()` | `bool` | 检查 toggle shortcut 是否注册 |

| `shortcut_retry()` | `bool` | 重新注册 settings 中的快捷键 |

| `open_accessibility_settings()` | `()` | macOS 打开 Accessibility 设置页；其他平台 no-op |

| `clipboard_read()` | `ClipboardSniff` | [13 § 3.5](13_schemas.md) |

| `open_log_dir()` | `()` | Finder 打开 `~/Library/Logs/Jsonita/` |

| `open_db_path()` | `()` | Finder 打开 history.db 所在目录 |

| `quit_app()` | `()` | 正常退出（不弹确认） |

## 7Events 总表（Rust → 前端）

| 事件名 | 触发时机 | payload 类型 | 消费方 |

| --- | --- | --- | --- |

| `tray:toggle` | tray 左键 / Toggle Jsonita 菜单项 | `{}` | Rust main listener → window::toggle |

| `tray:open-settings` | tray Settings 菜单项 | `{}` | App.tsx → setSettingsModalOpen(true) |

| `permission:accessibility_missing` | macOS 快捷键权限缺失 | `{}` | App.tsx → AccessibilityModal |

| `window:shown` | 浮窗被 show/focus | `{}` | FloatingWindow summon 动效；旧 ShortcutHint HUD 已移除 |

| `window:resized` | 智能缩放完成 | `WindowResizedPayload` | shell / store 同步尺寸 |

| `shortcut:restore_last` | 全局 ⌘⇧L 触发（Rust 先 show/focus） | `{}` | shell（调 `session_load_last` ） |

| `settings:changed` | `settings_set` /`settings_reset` 后 | `Settings` | store/settings（更新本地缓存 + 重渲染） |

所有 payload 完整字段定义： `ClipboardSniff` /`LastSession` /`WindowResizedPayload` 见 [13 § 3.2 / 3.5](13_schemas.md)。

### 7.1TS 监听封装

所有事件用一个泛型 `on()` 监听 ── 编译期检查事件名 + payload 类型匹配。

```

// src/ipc/events.ts
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

type EventMap = {
  'tray:toggle':           Record<string, never>;
  'tray:open-settings':    Record<string, never>;
  'permission:accessibility_missing': Record<string, never>;
  'window:shown':          Record<string, never>;
  'window:resized':        WindowResizedPayload;
  'shortcut:restore_last': Record<string, never>;
  'settings:changed':      Settings;
};

export function on<K extends keyof EventMap>(
  name: K,
  handler: (payload: EventMap[K]) => void,
): Promise<UnlistenFn> {
  return listen<EventMap[K]>(name, (e) => handler(e.payload));
}

```

## 8错误契约（调用方视角）

错误类型的完整定义（variant / payload）见 [13 § 1](13_schemas.md)；本表只描述 IPC 返回与调用方可用信息。用户可见呈现由 [design/02 § 5.1](../design/02_interaction.md#5.1错误呈现矩阵) 维护。

| 错误 kind | 常见 command | IPC payload / 调用方信息 | 调用方处理 |

| --- | --- | --- | --- |

| `Parse` | json_format / minify / stringify | line / col / msg | 保留位置并交给编辑器状态 |

| `UnwrapTimeout` | json_unwrap_stringified | timeoutMs / context | 保留超时信息 |

| `Sqlite` | history_* / session_* | sqlite error summary | 调用方可降级或记录日志 |

| `Secrets` | ai_set_api_key / ai_fix | secret operation + error summary | 调用方保留操作上下文 |

| `Http` | ai_fix / ai_test_connection | status / body 摘要 | 调用方按 status 分类 |

| `RateLimit` | ai_fix | retryAfterSec | 调用方可显示等待时间或延迟重试 |

| `AiInvalidJson` | ai_fix | raw model output | 调用方必须避免覆盖原输入 |

| `Io` | open_log_dir / open_db_path | path / operation / error summary | 调用方记录并保留用户上下文 |

四 · 运行时数字

## 9性能与限流

前端 debounce ：编辑器 onChange → format/parse 调用，统一 300 ms debounce（见 [00 § 5.1](00_architecture.md) ）

后端不主动节流 ：所有 command 来一个跑一个；CPU 密集走 `spawn_blocking`

AI 不限频 ：依 [plan/01 F4](../plan/01_features.md) ，用户用自己 key，仅透传上游 429

SQLite WAL ：所有 read 并发；write 串行（rusqlite + single connection per thread + r2d2 pool）
