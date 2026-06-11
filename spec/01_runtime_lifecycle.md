# 运行时生命周期

Jsonita 的运行时目标是“常驻但不打扰”：菜单栏图标长期存在，浮窗提前预热，用户按 `Cmd+Shift+J` 时快速出现，平时隐藏但不销毁。这个策略服务于工具类应用的核心体验：呼出快、状态不乱、退出明确。

## 读完这篇你应该知道

- App 启动后为什么先构建隐藏 WebView。
- `hide`、`close`、`quit` 的区别。
- 全局快捷键、菜单栏、窗口焦点如何协作。
- 生命周期失败时用户会看到什么。

## 启动阶段

启动时 Rust host 先初始化本地能力：日志、settings、window store、SQLite、secrets store、tray、global shortcut。随后创建 WebView window，但默认 `visible: false`。WebView、React、CodeMirror 在后台完成加载，用户第一次呼出时不再现场 build 窗口。

这种预热会占用稳定内存，但换来低延迟呼出。对 Jsonita 这种频繁短用的工具，呼出速度优先于极限省内存。

## 生命周期状态

| 状态 | 进入方式 | 系统行为 | 用户可见结果 |
| --- | --- | --- | --- |
| Starting | App 进程启动 | 初始化 Rust services 和隐藏 WebView | 菜单栏图标准备出现。 |
| WarmHidden | WebView 已加载但隐藏 | 监听快捷键和 tray 事件 | 用户看不到窗口，但再次呼出很快。 |
| Showing | `Cmd+Shift+J` 或 tray toggle | 定位到当前鼠标屏幕，显示并聚焦 | 浮窗出现在屏幕中央偏上。 |
| Active | 用户编辑或操作 | WebView 管理 editor/pane 状态 | 用户正常处理 JSON。 |
| Hiding | `Esc`、`Cmd+W`、失焦或 close | 播放隐藏过渡后 `window.hide()` | 浮窗消失，进程继续常驻。 |
| Quitting | `Cmd+Q` 或 tray Quit | 停止监听、flush 日志、退出进程 | 菜单栏图标消失。 |

## 关闭不是退出

红色 traffic light、非编辑态 `Esc`、`Cmd+W`、失焦隐藏都映射为隐藏窗口，不销毁 WebView。这样可以保留当前 editor 内存状态，并让下一次呼出仍然走热路径。

真正退出只由 `Cmd+Q` 或 tray Quit 触发。退出不自动制造新的 last_session；last_session 只由合法 transform 或显式 session command 更新，详见 [07_storage_session.md](07_storage_session.md)。

## 焦点与快捷键

全局 `Cmd+Shift+J` 由 Rust 注册，负责从系统任意位置唤起 Jsonita。窗口内快捷键由 React 处理，例如 Tab 切 pane、`Cmd+Enter` apply、`Cmd+K` 清空、`Esc` 退出编辑态或隐藏窗口。

焦点策略是：用户能点击浮窗并编辑，但 Jsonita 不应该破坏用户正在使用的其他 App。macOS 上通过 NSPanel-like 行为、always-on-top 和非激活面板策略实现这个体验。视觉和交互细节由 `design/06_window.md` 与 `design/07_menubar.md` 维护。

## 失败语义

快捷键注册失败时，App 仍可通过菜单栏打开，但需要提示用户检查 Accessibility 或冲突快捷键。窗口创建失败是启动阻塞错误。隐藏失败不能导致进程退出；退出失败必须尽量 flush 日志并结束进程。

任何生命周期错误都不能写入 JSON 内容到日志，也不能修改 last_session。

## 附录

- 窗口、快捷键、系统 command 的完整签名见 [appendix/ipc-api.md](appendix/ipc-api.md)。
- window.json 字段见 [appendix/schemas.md](appendix/schemas.md)。
- Tauri window 配置见 [appendix/packaging-details.md](appendix/packaging-details.md)。
