# 附录：IPC API 明细

核心语义见 [03_ipc_boundary.md](../03_ipc_boundary.md)。本页只列签名、返回值、错误分支。

## Commands

| 分组 | command | 返回 | 主要错误 |
| --- | --- | --- | --- |
| json_ops | `json_format(text, opts)` | `String` | Parse / Io |
| json_ops | `json_minify(text)` | `String` | Parse / Io |
| json_ops | `json_unwrap_stringified(text, opts)` | `String` | Parse / UnwrapTimeout / Io |
| json_ops | `json_stringify(text, opts)` | `String` | Parse / Io |
| json_ops | `json_parse(text)` | `String` | Parse |
| history | `history_list(opts)` | `Vec<HistoryRow>` | Sqlite |
| history | `history_search(query, limit)` | `Vec<HistoryRow>` | Sqlite |
| history | `history_pin(id, pinned)` | `()` | Sqlite |
| history | `history_star(id, starred)` | `()` | Sqlite |
| history | `history_clear()` | `u32` | Sqlite |
| history | `history_add(content, opType)` | `HistoryRow` | Sqlite |
| session | `session_save_last(s)` | `()` | Sqlite |
| session | `session_load_last()` | `Option<LastSession>` | Sqlite |
| session | `session_clear_last()` | `()` | Sqlite |
| settings | `settings_get_all()` | `Settings` | Io |
| settings | `settings_set(patch)` | `Settings` | Io / Parse |
| settings | `settings_reset()` | `Settings` | Io |
| ai | `ai_fix(req)` | `AiFixResp` | AiDisabled / Secrets / Http / RateLimit / AiInvalidJson |
| ai | `ai_test_connection(apiKey, modelId)` | `TestConnectionResp` | Http / RateLimit |
| ai | `ai_set_api_key(apiKey)` | `()` | Secrets |
| ai | `ai_delete_api_key()` | `()` | Secrets |
| ai | `ai_has_api_key()` | `bool` | Secrets |
| window | `window_show()` | `()` | Io |
| window | `window_hide()` | `()` | Io |
| window | `window_toggle()` | `()` | Io |
| window | `window_resize_for_content(metrics)` | `(u32, u32)` | Io |
| window | `window_reset_size()` | `()` | Io |
| window | `window_set_theme(mode)` | `light | dark` | Io |
| system | `shortcut_register(req)` | `ShortcutRegisterResp` | Io |
| system | `shortcut_status()` | `bool` | Io |
| system | `shortcut_retry()` | `bool` | Io |
| system | `open_accessibility_settings()` | `()` | Io |
| system | `clipboard_read()` | `ClipboardSniff` | Io |
| system | `open_log_dir()` | `()` | Io |
| system | `open_db_path()` | `()` | Io |
| system | `quit_app()` | `()` | Io |
| logging | `frontend_log(event)` | `()` | Io |

## Events

| event | payload | 触发 |
| --- | --- | --- |
| `settings:changed` | `Settings` | settings 写入成功或 reset。 |
| `window:shown` | none | Rust show 后通知前端播放进入态。 |
| `window:will-hide` | none | hide 前通知前端播放退出态。 |
| `window:resized` | `WindowResizedPayload` | 用户拖动或智能缩放。 |
| `shortcut:registered` | shortcut status | 快捷键注册/重试结果。 |
| `clipboard:sniffed` | `ClipboardSniff` | 需要剪贴板探测时。 |
| `log:exported` | path/status | 日志导出结束。 |

## 命名约定

| 对象 | 约定 | 例子 |
| --- | --- | --- |
| command | snake_case | `window_resize_for_content` |
| event | namespace:name | `settings:changed` |
| Rust field | snake_case | `retry_after_sec` |
| IPC JSON field | camelCase | `retryAfterSec` |
| enum value | kebab-case | `str-to-json` |
