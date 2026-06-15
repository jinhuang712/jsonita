# 窗口 runtime

浮窗的创建、定位、显隐、失焦、动效、生命周期 ── 先讲设计决策，再用决策图与状态机讲机制，最后给契约。

本章描述 窗口 runtime 设计与机制； `ContentMetrics` /`WindowResizedPayload` 等 IPC payload 见 [A00 schemas](../spec/appendix/A00-schemas.md)； `window.json` 持久化字段见 [A00 schemas](../spec/appendix/A00-schemas.md)；窗口命令签名见 [I01 IPC API](../spec/platform/I01-ipc-api.md)；视觉效果见 [01 § 11 智能缩放](../design/01_mockups.md)。

## 一 · 设计

### 1 能力清单与 plan 锚定

| 能力 | plan 锁定 | 本章解决 |
| --- | --- | --- |
| 始终置顶 + 不抢焦点 | [02 § 1](../design/02_interaction.md) | § 3 NSPanel-like |
| 呼出 < 500 ms | [04 § 1](../plan/04_nfr.md) | § 2.1 预热 + § 8 生命周期 |
| 定位到光标屏中央偏上 | 02 § 1 | § 4 多屏定位 |
| 失焦自动隐藏（可关） | 02 § 1 | § 6 失焦监听 |
| 关闭浮窗保留 last_session | plan/01 F8 | § 5 关闭事件路由；合法内容由实时 transform 持久化 |
| 150 ms 淡入 / 140 ms 淡出 | 02 § 3 | § 8 动效（CSS only） |
| 原生玻璃 / vibrancy | [design/HANDOFF](HANDOFF.md) 阶段 3 | § 3.4 Tauri window effects + 透明窗口 |
| 记忆大小（不记忆位置） | 02 § 1 | § 7 智能缩放 / 持久化 |

### 2 关键设计决策

#### 2.1 WebView 预热：呼出时只 show，不 build

启动时就 `WebViewWindowBuilder.build()` （ `visible: false` ），把 DOM / CodeMirror / React 全部就绪。后续 `⌘⇧J` 只调 `window.show()` + 定位 ── 亚毫秒级。代价是稳态占 ~80 MB 内存，但换来呼出 < 500 ms 体验，对工具类应用是正确取舍（详见 [S00 system architecture](../spec/S00-system-architecture.md) ）。

#### 2.2 NSPanel 而不是 NSWindow（macOS）

Tauri 默认 `alwaysOnTop: true` 在 macOS 等同 `NSWindow.setLevel(.floating)` ── 但会 抢焦点。用户的 `⌘Tab` 切走会让浮窗一同隐没。NSPanel 配合 `nonactivatingPanel` styleMask 是唯一可靠方案 ── panel 可接收点击但不切换应用焦点。详见 § 3。

#### 2.3 关闭 = hide 而非 close

红色 traffic light / 非编辑态连续两次 `Esc` /`⌘W` 映射为 `window.hide()`，进程保留 ── 这样下次呼出依然是亚毫秒级。焦点在 CodeMirror 或表单输入内时，第一下 `Esc` 只 `blur()` 退出 editing，且不计入双击关闭窗口；退出编辑态后再按一次 `Esc` 会先显示 Double Esc to close 提示，第二次才隐藏浮窗。 只有 `⌘Q` 或 tray Quit 才真正退出应用。详见 § 5 关闭事件路由。

#### 2.4 定位到光标所在屏，不记忆位置

多屏用户的鼠标当下在哪屏，浮窗就出现在哪屏 ── 这是工具类应用的常识。 大小 可以记忆（用户拖宽后下次保持），但 位置 永远按当前鼠标算 ── 避免"上次在外接屏 → 现在没接外接屏 → 浮窗看不见"。详见 § 4。

#### 2.5 动效全部 CSS / 前端实现

阶段 2 已接入 show/hide 过渡：Rust show 后 emit `window:shown`，hide 前 emit `window:will-hide` 并延迟约 140 ms；React 根容器切换 `.jsonita-floating-window-shown` /`.jsonita-floating-window-hiding`，只动 opacity / transform。

#### 2.6 原生玻璃材质跟随主题

窗体 / 编辑器全透明，靠原生 `NSVisualEffectView` （vibrancy）托底，材质 + NSWindow appearance 必须跟随 effective theme： `window::apply_glass_mode(mode)` 解析后 dark 用 `HudWindow` 暗材质、light 用 `Popover`。light / dark 钉死对应 appearance（ `aqua` /`darkAqua` ）； system 把 appearance 设 `nil` 跟随 OS。

system 的 effective 由原生权威解析：经 `NSApp.effectiveAppearance` 读真实 OS 主题， 不靠 webview 的 `matchMedia` ── 因为 NSWindow.appearance 一旦钉死具体值就会污染 WKWebView 的 `prefers-color-scheme` （曾踩坑：从 light 切到 system 不变 dark），且系统运行时切换主题也无法推送给 webview；设 `nil` 跟随 OS 两个问题都解。 `window_set_theme(mode)` 把解析后的 `"light" | "dark"` 回传前端作权威值（ [I01 IPC API](../spec/platform/I01-ipc-api.md) ）。

启动先按 `system` （跟随 OS）应用，前端 `useEffectiveTheme` 挂载及每次切换调 `window_set_theme(mode)` 用持久化 `settings.theme` 校正并取回 effective。否则深色半透卡片叠在偏亮材质上发灰发糊 ── 曾因材质写死 `Popover` 且只在启动应用而踩坑。

## 二 · 工作机制

### 3 NSPanel-like 实现

#### 3.1 关键标志位

把底层 NSWindow 替换为 NSPanel 后，设置以下标志位 ── 每一位都解决一个具体问题：

| 标志位 | 值 | 解决的问题 |
| --- | --- | --- |
| styleMask |  |  |
| `.nonactivatingPanel` | 1 << 7 | 关键：让 panel 接收点击但不切换应用焦点 |
| `.titled` | 1 << 0 | 需要 title bar 容器（即使隐藏标题文字） |
| `.resizable` | 1 << 3 | 必须保留：promote 重写 styleMask 时若丢掉此位，Tauri `startResizeDragging` 无法拖边 resize |
| `.fullSizeContentView` | 1 << 15 | WebView 内容占满整个窗口（含 title bar 区域） |
| 标准窗口按钮 | close / miniaturize / zoom | 必须隐藏：保留 `.titled` + `.resizable` 后 AppKit 会恢复 traffic lights，需要显式 `setHidden:YES` |
| collectionBehavior |  |  |
| `.canJoinAllSpaces` | 1 << 0 | 切 Space 后浮窗仍可见 |
| `.stationary` | 1 << 4 | Mission Control 视图中不被作为窗口堆叠 |
| `.fullScreenAuxiliary` | 1 << 8 | 在其他 App fullscreen 上方仍可见 |
| 其他 |  |  |
| level | 3 (`.floating`) | 常驻置顶 |
| isMovableByWindowBackground | false | 禁止拖动整个浮窗（拖动通过 title bar 区） |

#### 3.2 调用骨架（~15 行）

实际实现走 `cocoa` crate + `objc` msg_send；保留 关键 3 个 setter 调用，标志位组合见 § 3.1。完整代码在 `src-tauri/src/system/window_panel.rs`。

```
#[cfg(target_os = "macos")]
pub fn promote_to_nspanel(win: &tauri::WebviewWindow) -> Result<(), JsonitaError> {
    let ns_window = win.ns_window()? as id;
    unsafe {
        // styleMask（含关键的 .nonactivatingPanel = 1 << 7；同时保留 .resizable）
        let mask = NSWindowStyleMask::NSTitledWindowMask
            | NSWindowStyleMask::NSResizableWindowMask
            | NSWindowStyleMask::NSFullSizeContentViewWindowMask
            | NSWindowStyleMask::from_bits_unchecked(1 << 7);
        ns_window.setStyleMask_(mask);
        ns_window.setTitleVisibility_(NSWindowTitleHidden);
        ns_window.setTitlebarAppearsTransparent_(YES);
        hide_standard_window_buttons(ns_window);
        // collectionBehavior（多 Space + Mission Control + fullscreen 协作）
        ns_window.setCollectionBehavior_(JOINS_ALL_SPACES | STATIONARY | FULLSCREEN_AUX);
        // 提升到 floating level
        let _: () = msg_send![ns_window, setLevel: 3i64];
    }
    Ok(())
}
```

#### 3.3 Windows 端的对应行为

Windows 10/11 不需要类似 NSPanel： `"alwaysOnTop": true` + `"focus": false` 已能做到始终置顶；显示用 `ShowWindow(hwnd, SW_SHOWNOACTIVATE)` 不抢焦点；无需 unsafe。v2 跨平台时只需在 macOS 上额外调本节代码。

#### 3.4 原生玻璃 vibrancy（阶段 3 已实现）

窗口配置保持 `transparent: true` + `backgroundColor: [0,0,0,0]`；启动时在 NSPanel-like promote 后先把 window / WKWebView runtime 背景设为透明，再调用 Tauri `WebviewWindow::set_effects`，使用 `EffectsBuilder::effect(Effect::Popover).state(EffectState::Active).radius(16)`。这条路径由 Tauri 内部映射到 macOS `NSVisualEffectView`，避免手写 subview 管理；React/CSS 只负责半透明叠色、边框和阴影。

透明兜底：promote 改写 `styleMask` 后，macOS 端还会显式调用 `setOpaque(false)` 与 `setBackgroundColor(NSColor.clearColor)`，并通过 `WebviewWindow::set_background_color(Color(0,0,0,0))` 触发 WKWebView 的 `drawsBackground=false` /`underPageBackgroundColor=clear` 路径，确保 NSWindow/titlebar/WebView 不恢复不透明底色；前端 chrome / editor 叠层必须使用 [03](03_design_tokens.md) 中的轻量 `--chrome-bg`、 `--editor-bg`，不能再用整块 `--bg-card` 覆盖 vibrancy。

### 4 多屏定位

#### 4.1 决策流程

呼出时按"光标所在屏"定位 ── 不是主屏，不是上次屏。优雅处理鼠标在屏外、单屏断开等边界：

在某屏 N 鼠标在屏外
(屏断开等边界) 呼出触发 读 cursor_position 全局坐标 鼠标在
哪屏 work_area? 使用屏 N 的
work_area 使用 primary monitor 计算坐标:
x = mx + (mw - ww) / 2
y = my + (mh - wh) / 3 window.set_position

#### 4.2 关键参数

| 参数 | 值 | 设计意图 |
| --- | --- | --- |
| x | `mx + (mw - ww) / 2` | 水平中央 |
| y | `my + (mh - wh) / 3` | 上 1/3 而不是中央 ── 避免遮挡用户当前关注的窗口区域 |
| work_area | 排除 dock + menubar | 避免浮窗压到 menubar / dock 上 |
| scale_factor | 取 cursor 所在屏的 | Retina 屏物理 px ≠ 逻辑 px，需除以 scale 转 LogicalPosition |

#### 4.3 核心调用（~10 行）

```
// src-tauri/src/system/cursor.rs ── 核心循环
let cursor = app.cursor_position()?;
let monitor = app.available_monitors()?.into_iter()
    .find(|m| {
        let (p, s) = (m.position(), m.size());
        cursor.x >= p.x as f64 && cursor.x < (p.x + s.width  as i32) as f64
            && cursor.y >= p.y as f64 && cursor.y < (p.y + s.height as i32) as f64
    })
    .or_else(|| app.primary_monitor().ok().flatten())
    .ok_or_else(|| JsonitaError::Io("no monitor".into()))?;

// LogicalPosition 计算（含 scale），详见源码
let (x, y) = compute_centered_top_third(&monitor, win.outer_size()?);
window.set_position(tauri::LogicalPosition::new(x, y))?;
```

### 5 关闭事件路由

"关闭"这个动作来自 6 个来源，分别走 退出 editing、 hide 或 真 close + quit。下图是完整路由：

关闭来源 true false Esc 键
(editing 中) Esc 键 ×2
(非 editing) ⌘W 失焦 (hide_on_blur=true) 红 traffic light tray → Quit ⌘Q activeElement.blur
退出 editing 前端 window_hide on_window_event
Focused false CR app.exit settings
.hide_on_blur? Hide no-op api.prevent_close
拦截关闭 app.exit

#### 5.1 来源 → 路由对照

| 来源 | 路由 | 是否保存 session |
| --- | --- | --- |
| `Esc` （editing 中） | blur active editor/input，只退出 editing，不计入关闭窗口双击 | 否 |
| `Esc` ×2（非 editing） | hide；单次 Esc 进入待关闭窗口并显示 Double Esc to close 提示 | 否；合法内容已由实时 transform 保存 last_session |
| `⌘W` | hide | 否；合法内容已由实时 transform 保存 last_session |
| 失焦（hide_on_blur=true） | hide | 否；合法内容已由实时 transform 保存 last_session |
| 红 traffic light 点击 | hide（拦截 close → hide） | 否；合法内容已由实时 transform 保存 last_session |
| menubar → Quit | close + app exit | 是（quit 前最后一次） |
| `⌘Q` | close + app exit | 是 |

#### 5.2 close interceptor（~6 行）

```
// 把红 traffic light 触发的 CloseRequested 改写为 hide；
// 双击 Esc / ⌘W 由前端 useGlobalHotkeys 调用 window_hide。
fn register_close_intercept(win: &tauri::WebviewWindow) {
    let w = win.clone();
    win.on_window_event(move |event| {
        if let tauri::WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = w.hide();
        }
    });
}
```

### 6 失焦自动隐藏

#### 6.1 触发与例外

| 场景 | 是否触发隐藏 | 原因 |
| --- | --- | --- |
| 用户切到其他 App | 是 （hide_on_blur=true 时） | 核心场景 |
| 用户打开 React 内的 Settings / History modal | 否 | 同窗口 React modal，window 不失焦 |
| 用户右键唤起系统 menu | 否 | macOS NSMenu 不触发 WindowEvent::Focused(false) |
| 用户 ⌘Tab 切到自己另一个 Space | 取决于 NSPanel collectionBehavior | 已加 `canJoinAllSpaces` （§ 3.1）→ 不触发 |
| 系统弹出系统级 dialog（权限请求） | 有可能触发 | 用户可设 hide_on_blur=false 兜底 |

#### 6.2 监听核心（~10 行）

```
pub fn install_blur_hide(win: &tauri::WebviewWindow, app: &tauri::AppHandle) {
    let app_handle = app.clone();
    let win_label  = win.label().to_string();
    win.on_window_event(move |event| {
        if let tauri::WindowEvent::Focused(false) = event {
            if !app_handle.state::<SettingsStore>().get().hide_on_blur { return; }
            if let Some(w) = app_handle.get_webview_window(&win_label) {
                let _ = w.hide();
            }
        }
    });
}
```

### 7 智能缩放（plan F10 · 4 层逻辑）

#### 7.1 4 层决策

用户输入大 JSON 或调整字体时，自动按内容宽高缩放窗口 ── 但窗口尺寸不是逐字符函数，而是进入 / 离开舒适阅读区时才调整。决策图：

否 是 否 是 结构宽度 / 行数 / 字号变化
触发 window_resize_for_content smart_width
设置开启? no-op
用户关了智能缩放 visible_cols = soft_wrap ? min(max_line_chars, 88) : max_line_chars
auto floor: 860×560
ideal_h = clamp(line_count × line_px + 120, floor_h, max_h) 超出舒适区?
grow > 72px / shrink > 120px no-op
避免 Tab / 小编辑抖动 set_size
source=auto

#### 7.2 4 层逻辑落地

| 层 | 触发点 | 实现位置 |
| --- | --- | --- |
| 1 · 首次呼出尺寸 | 启动窗口配置 /`WindowStore::default()` | 当前固定 860 × 560； `settings.initialWidth` 尚未接入 |
| 2 · 内容驱动动态缩放 | 编辑器结构宽度 / 行数 / 字号变化 → 前端调 `window_resize_for_content` | 前端 `useSmartWidth` + Rust `cmds::window`；行首缩进变化不触发窗口 resize |
| 3 · 手动拖边缩放 | 自定义 8 个 resize handle → Tauri `startResizeDragging` →`WindowEvent::Resized` | `WindowResizeHandles` + `WindowStore` （§ 7.4）；记忆尺寸并暂停智能缩放，Reset Size 后恢复内容驱动模式 |
| 4 · soft-wrap | 软换行开时宽度保守、仍按行数 / 字体计算高度 | `ContentMetrics.softWrapOn` 参与后端计算 |

单窗切换联动（阶段 1 已实现 →[07 § 2](07_menubar.md) ·[design/HANDOFF.md](HANDOFF.md) § 5）： `singlePaneMode` 由状态栏 `Switch to [Single / Split] Panel` 控件或快捷键 `⌘\` 切换；切换 只切换布局 （双栏 grid ↔ 单栏）， 不随切换自动改窗口尺寸 —— 实测「toggle 后延迟跳一次原生窗口」与布局切换不同步、手感 clunky，已移除；窗口尺寸仍由内容 / 字号驱动的智能缩放（§ 7）按当前模式的宽度约束调整。

#### 7.3 持久化字段（window.json）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `width / height` | u32 | 用户拖动 / 智能缩放后的尺寸 |
| `userDragged` | bool | 记录用户曾手动拖边，用于恢复上次尺寸；作为内容动态缩放的硬锁，Reset Size 清除 |

#### 7.4 用户拖动监听

读取自愈：启动读取 `window.json` 时，如果 `userDragged=false` 且尺寸低于智能缩放舒适区 floor（默认 860 × 560），视为旧版自动缩放写出的坏状态，恢复默认 860 × 560；如果 `userDragged=true`，仅夹到手动拖拽硬下限 440 × 340。

无系统边框时，React 端渲染 `WindowResizeHandles` （N / S / E / W / 四角）并调用 Tauri `startResizeDragging(direction)`。监听 `WindowEvent::Resized` → 写 `window.json` + 设 `userDragged = true` 以恢复上次尺寸，并让 `window_resize_for_content` no-op。 智能缩放内部 `set_size()` 时通过操作前后 sentinel 标志区分，避免误标 `userDragged`；当前只有智能缩放会 emit `window:resized { source: "auto" }`。

#### 7.4.1 拖动窗口位置

由于 `decorations=false`，没有原生标题栏。当前 `TabBar` 背景 / 空白区域监听 `mousedown` 并调用 Tauri `startDragging()`；Tab 按钮本身不触发拖动，保持点击切换。

#### 7.5 重置入口

`window_reset_size` command 会删除 `window.json` 并把内存状态重置为 860 × 560；当前 Settings UI 未渲染"重置浮窗尺寸"按钮。

### 8 窗口生命周期

应用启动 创建窗口 (visible:false)
+ NSPanel-like + vibrancy
+ 注册事件 shortcut / tray toggle 触发 locate_window
(光标屏 + 中央偏上) window_show() command
(不重新定位) window.show() + set_focus()
WebView 保持当前 store 状态 Esc while editing
activeElement.blur() 双击 Esc 非 editing / 失焦 / ⌘W
window.hide() ⌘Q / Tray Quit ⌘Q app.exit Setup Hidden Locating Showing Visible Quitting

#### 8.1 动效（reserved / future）

阶段 2 已接入窗口 show/hide CSS 动画。Rust 端不再立即 hide：先广播 `window:will-hide`，等待 140 ms 后再调用平台 `hide()`。动画只允许 opacity + translate，不使用 CSS scale，避免与真实窗口 resize 叠加造成“缩放错觉”。

| 阶段 | React 类名 | 动画 | 时长 / 缓动 |
| --- | --- | --- | --- |
| 显示后 | `.jsonita-floating-window-shown` | `jsonita-window-summon` | `--dur-base` （150ms）/`--ease-native` |
| 关闭前 | `.jsonita-floating-window-hiding` | `jsonita-window-dismiss` | 140ms /`--ease-in` |
| reduced-motion | — | animation-duration: 1ms | — |

淡出同步：所有 hide 路径（快捷键、托盘、失焦、close request）统一走 Rust `animated_hide`，避免前端路径和系统路径动画不一致。

## 三 · 契约

### 9 tauri.conf.json 关键字段

完整配置文件维护在 `src-tauri/tauri.conf.json`；下表是 窗口章节相关的关键字段，每个都有具体原因：

| 字段 | 值 | 原因 |
| --- | --- | --- |
| label | `"main"` | 所有 window_* command 通过 label 路由 |
| width / height | 860 / 560 | 默认尺寸； `settings.initialWidth` 字段尚未接入窗口创建 |
| minWidth / minHeight | 440 / 340 | 手动拖拽的硬下限；智能缩放另有不低于默认窗口的舒适区 floor（860×560），见 § 7.1 |
| resizable | true | 允许用户拖边 resize；无装饰窗口通过自定义 handles 触发 |
| decorations | false | 无系统标题栏 → TabBar 拖动 + 自定义 resize handles |
| transparent | true | 原生 vibrancy + 玻璃浮窗叠色需要；详见 § 3.4 |
| backgroundColor | `[0,0,0,0]` | 建窗时同步清空 window / webview 背景，避免 WKWebView 盖住原生 vibrancy |
| shadow | true | 系统阴影 + CSS 玻璃阴影共同分层 |
| alwaysOnTop | true | 常驻置顶（macOS 上 NSPanel 进一步加强） |
| visible | false | 启动不显示，预建好等待呼出 |
| focus | false | 创建时不抢焦点 |
| dragDropEnabled | false | v1 不读 fs，禁止 drag-drop |
| titleBarStyle | "Overlay" | macOS：traffic light 浮在内容上，无 title 文字 |
| hiddenTitle | true | macOS：隐藏标题文字但保留 traffic light |
| acceptFirstMouse | true | macOS：未聚焦时也响应首次点击 |

### 10 命令 / 事件接口

窗口章节涉及的 IPC 接口（完整签名见 [I01 IPC API](../spec/platform/I01-ipc-api.md) ）：

| 接口 | 类型 | 触发 |
| --- | --- | --- |
| `window_show / hide / toggle` | command | UI 显隐控制（快捷键 / tray / 关闭按钮） |
| `window_resize_for_content(metrics)` | command | 智能缩放（§ 7）；metrics: ContentMetrics |
| `window_reset_size` | command | 清掉 window.json 记忆 |
| `window:shown` | event | 窗口 show / focus 后；用于触发 summon 动效（旧右下角快捷键 HUD 已移除） |
| `window:will-hide` | event | 窗口 hide 前；用于播放 140ms dismiss 动效 |
| `window:resized` | event | 智能缩放后；source = auto |
