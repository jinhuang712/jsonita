SPEC · 章节 07

# 菜单栏 & 快捷键

tray icon · 全局快捷键注册 / 冲突检测 / 权限引导 · 平台差异。

## 1 菜单栏 tray

### 1.1 结构

常驻菜单栏图标，单击左键 → toggle 浮窗；右键 → 弹下拉菜单。完整下拉菜单视觉：见 [12 § 4 菜单栏 tray](../design/01_mockups.md#4-设置-modal)。

菜单项序：

| order | label | accelerator | action |
| --- | --- | --- | --- |
| 1 | Toggle Jsonita | — | emit tray:toggle |
| 2 | Settings… | `⌘,` | show window + emit tray:open-settings |
| — | (separator) | — | — |
| 3 | Quit Jsonita | `⌘Q` | app.exit(0) |

### 1.2 实现

```
// src-tauri/src/system/tray.rs
use tauri::{
    AppHandle, Manager,
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

pub const TRAY_ICON_PATH: &str = "icons/menubar/jsonita-menubar-template-22@2x.png";

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    let menu = build_menu(app)?;

    let icon = Image::from_path(
        app.path().resolve(TRAY_ICON_PATH, tauri::path::BaseDirectory::Resource)?
    )?;

    let tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(cfg!(target_os = "macos"))    // macOS template
        .menu(&menu)
        .menu_on_left_click(false)                       // 左键交给 on_event
        .show_menu_on_left_click(false)
        .on_tray_icon_event(handle_tray_event)
        .on_menu_event(handle_menu_event)
        .build(app)?;

    app.manage(tray);                                    // 防止 drop 后 tray 消失
    Ok(())
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let toggle   = MenuItem::with_id(app, "toggle",   "Toggle Jsonita", true, None::<&str>)?;
    let settings = MenuItem::with_id(app, "settings", "Settings…",      true, Some("CmdOrCtrl+,"))?;
    let quit     = MenuItem::with_id(app, "quit",     "Quit Jsonita",   true, Some("CmdOrCtrl+Q"))?;
    let sep      = PredefinedMenuItem::separator(app)?;

    Menu::with_items(app, &[&toggle, &settings, &sep, &quit])
}

fn handle_tray_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click { button: MouseButton::Left, button_state: MouseButtonState::Up, .. } = event {
        let app = tray.app_handle();
        let _ = commands::window::window_toggle(app.clone());
    }
}

fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "toggle"       => { let _ = app.emit("tray:toggle", ()); }
        "settings"     => {
            let _ = crate::window::toggle_show_only(app);
            let _ = app.emit("tray:open-settings", ());
        }
        "quit"         => { app.exit(0); }
        _ => {}
    }
}
```

### 1.3 动态图标

v1 不做。
v2 可扩展：检测到剪贴板含 JSON 时 tray 图标加红点，提示 user "have something to format"。

### 1.4 "在菜单栏显示图标" 开关（reserved / future）

当前 `settings.show_in_menubar` 字段存在，但运行时未消费；tray 始终创建。未来接入该开关时：

调 `tray.remove()`

用户只能通过快捷键呼出（保留对快捷键的依赖）

Dock 图标也跟随：菜单栏关 + dock 关 → 应用就完全 headless（必须留 Quit 入口 → 不允许同时关）

## 2 全局快捷键

### 2.1 默认绑定

| action | 默认 accelerator | 是否可自定义 |
| --- | --- | --- |
| toggle_window | `CmdOrCtrl+Shift+J` | 是（全局） |
| restore_last | `CmdOrCtrl+Shift+L` | 是（全局） |
| split_toggle（单窗 / 双栏） | `CmdOrCtrl+\` | 是（窗口内；阶段 1 已实现） |

其他 in-app 快捷键（ `Tab` /`⇧Tab` /`⌘K` /`⌘⇧L` /`Esc` /`⌘W` ）由 React 端处理，不走 global-shortcut（不抢系统）。 `split_toggle` （ `⌘\` 切换单窗 / 双栏，阶段 1 已实现）也属窗口内快捷键，但可在设置「快捷键 → 可自定义」改键，与 `toggle_window` /`restore_last` 并列；其状态栏控件与 `⌘Y` History 一样，平时只显文字、hover / 键盘聚焦才浮现键位（见 [01 § 2](../design/01_mockups.md#2-状态栏-4-态对照) ）。

### 2.2 注册

```
// src-tauri/src/system/shortcuts.rs
use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut, ShortcutState};

#[derive(Copy, Clone)]
pub enum ShortcutAction { ToggleWindow, RestoreLast }

pub fn register_defaults(app: &AppHandle) -> Result<(), JsonitaError> {
    let settings = app.state::<SettingsStore>().get();
    register(app, ShortcutAction::ToggleWindow, &settings.shortcut_toggle)?;
    register(app, ShortcutAction::RestoreLast,  &settings.shortcut_restore_last)?;
    Ok(())
}

pub fn register(
    app: &AppHandle,
    action: ShortcutAction,
    accelerator: &str,
) -> Result<(), JsonitaError> {
    let shortcut = parse_accelerator(accelerator)?;
    let app_clone = app.clone();

    app.global_shortcut().on_shortcut(shortcut, move |_app, _sc, event| {
        if event.state() != ShortcutState::Pressed { return; }
        match action {
            ShortcutAction::ToggleWindow => {
                let _ = commands::window::window_toggle(app_clone.clone());
            }
            ShortcutAction::RestoreLast => {
                let _ = crate::window::toggle_show_only(&app_clone);
                let _ = app_clone.emit("shortcut:restore_last", ());
            }
        }
    })?;
    Ok(())
}

fn parse_accelerator(s: &str) -> Result<Shortcut, JsonitaError> {
    // 解析 "CmdOrCtrl+Shift+J" 风格字符串
    let mut mods = Modifiers::empty();
    let mut code: Option<Code> = None;
    for part in s.split('+') {
        match part.to_lowercase().as_str() {
            "cmd" | "command" | "meta" => mods |= Modifiers::META,
            "cmdorctrl" => {
                #[cfg(target_os = "macos")]   { mods |= Modifiers::META; }
                #[cfg(not(target_os = "macos"))] { mods |= Modifiers::CONTROL; }
            }
            "ctrl" | "control" => mods |= Modifiers::CONTROL,
            "alt"  | "option"  => mods |= Modifiers::ALT,
            "shift"            => mods |= Modifiers::SHIFT,
            other => code = Some(Code::from_str(&other.to_uppercase())
                                    .ok_or_else(|| JsonitaError::Io(format!("unknown key {}", other)))?),
        }
    }
    let code = code.ok_or_else(|| JsonitaError::Io("missing key".into()))?;
    Ok(Shortcut::new(Some(mods), code))
}
```

### 2.3 冲突检测

用户改快捷键时调 `shortcut_register` command：

```
#[tauri::command]
pub async fn shortcut_register(
    app: tauri::AppHandle,
    req: ShortcutRegisterReq,
) -> Result<ShortcutRegisterResp, JsonitaError> {
    // 1. 解析合法性
    let shortcut = parse_accelerator(&req.accelerator)?;

    // 2. 先 unregister 旧的
    let _ = app.global_shortcut().unregister(shortcut.clone());

    // 3. 尝试注册新的
    match app.global_shortcut().register(shortcut.clone()) {
        Ok(()) => {
            // 4. 把回调挂上
            install_handler(&app, req.action, shortcut)?;
            // 5. 写入 settings
            app.state::<SettingsStore>().set_shortcut(req.action, req.accelerator)?;
            Ok(ShortcutRegisterResp::Ok)
        }
        Err(e) => {
            // tauri-plugin-global-shortcut 在底层 platform 调用失败时返回 Err
            // 解读不到具体冲突 App（OS API 不暴露）→ 返回 Conflict { with_app: None }
            Ok(ShortcutRegisterResp::Conflict { with_app: None })
        }
    }
}
```

WARN

macOS / Windows 的全局快捷键 API 不直接 暴露"被哪个 App 占用"。我们只能知道注册成功与否。 `with_app: None` 时 UI 显示 "Already used by system or another app"。

### 2.4 系统级保留快捷键拒绝清单

注册前在 Rust 端先 reject 这些"绝不可改"的组合，避免给用户挖坑：

```
// 用户不能绑定的组合（系统级或会破坏 OS 体验）
const RESERVED: &[&str] = &[
    "CmdOrCtrl+Q",          // Quit App
    "CmdOrCtrl+W",          // Close Window
    "CmdOrCtrl+Tab",        // 应用切换
    "CmdOrCtrl+Space",      // Spotlight
    "CmdOrCtrl+H",          // Hide App
    "F11", "F12",           // 系统功能（Mission Control / 屏幕截图）
    "Escape",
];

fn check_reserved(acc: &str) -> Result<(), JsonitaError> {
    if RESERVED.iter().any(|r| acc.eq_ignore_ascii_case(r)) {
        return Err(JsonitaError::Io(format!("{} is reserved by system", acc)));
    }
    Ok(())
}
```

## 3 macOS Accessibility 权限

tauri-plugin-global-shortcut 在 macOS 不需要 Accessibility 权限 ── 它走 `CGEventTap` 的 Annotated event tap （监听键盘组合，不需要事件注入权限）。 v1 默认不要求。

但 macOS 13+ 在某些情况下仍会弹出 "Input Monitoring" 请求 ── 这种情况下：

### 3.1 检测 + 引导

```
// src-tauri/src/system/permissions.rs
#[cfg(target_os = "macos")]
pub fn check_input_monitoring() -> bool {
    // 通过尝试注册一个 dummy global shortcut 来 ping 系统
    // 失败 → 大概率是 input monitoring 没授权
    // 实际实现：调 IOHIDCheckAccess(kIOHIDRequestTypeListenEvent)
    unsafe {
        let access_type = 1;   // listen event
        let granted = ::core_foundation::base::TCFType::from_void(
            crate::ffi::IOHIDCheckAccess(access_type)
        );
        granted == 0   // kIOHIDAccessTypeGranted
    }
}

#[cfg(target_os = "macos")]
pub fn request_input_monitoring() {
    unsafe { let _ = crate::ffi::IOHIDRequestAccess(1); }
}
```

### 3.2 用户引导 UI

首次启动失败 → 弹 Accessibility Modal。视觉与文案：见 [12 § 10 macOS 权限引导 Modal](../design/01_mockups.md#10-empty-states)。当前实现打开 `Privacy_Accessibility` 设置页。

触发条件：

启动时 `register_defaults()` 失败

用户在设置面板录入新快捷键 → `shortcut_register()` 返回 `Conflict`

```
// 打开系统设置 → Privacy → Accessibility
fn open_accessibility_settings() {
    use std::process::Command;
    let _ = Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn();
}
```

## 4 In-app 快捷键

仅在浮窗 focus 时响应， 不 走 global-shortcut：

| action | combo | 实现 |
| --- | --- | --- |
| 切换功能 Tab | `Tab` /`⇧Tab` | window keydown capture；仅非编辑态拦截 |
| 退出 editing | `Esc` （焦点在 CodeMirror / 表单输入内） | window keydown capture → activeElement.blur() |
| 关闭浮窗 | `Esc` ×2（非编辑态） /`⌘W` | 连续两次 Esc 才调用 window_hide；单次 Esc 只进入待关闭窗口 |
| 错误 JSON 直接执行 AI Fix | `⌘Enter` | 当 parse error 且 AI Fix 可用时优先拦截；单双栏一致，切到 `AiFixPane` 并自动请求；单窗右下角提示显示 Run AI Fix 而不是 Run Format |
| 接受 AI Fix 结果 | `⌘Enter` | `awaiting-decision` 时优先拦截；替换输入、写 history、回到 Format |
| 取消 AI Fix 结果 | `Esc` | `awaiting-decision` /`error` 时优先拦截；reset AI store、回到 Format，不隐藏窗口 |
| 打开 / 关闭 History | `⌘Y` | window keydown capture；即使编辑器聚焦也响应；Settings 打开时不拦截 |
| 打开 Settings | `⌘,` | window keydown capture；与 macOS menu accelerator 一致；History 打开时不拦截 |
| 单窗模式应用当前功能 | `⌘Enter` | window keydown capture；仅 `singlePaneMode=true` 时拦截并写回 input |
| 编辑器 / Tree 字体放大 | `⌘+` | window keydown capture；每次 +2px，更新 UI store 字号并触发动态窗口缩放 |
| 编辑器 / Tree 字体缩小 | `⌘-` | window keydown capture；每次 -2px |
| 重置编辑器 / Tree 字号 | `⌘0` | window keydown capture；回到 13px |
| 清空输入（不污染上次会话） | `⌘K` | React useHotkeys + session_clear_last |
| 恢复上次会话 | `⌘⇧L` | React useHotkeys + session_load_last |
| CodeMirror 内置 | `⌘F` /`⌘D` /`⌘Z` /`⌘⇧Z` | CodeMirror 6 默认 keymap |

```
// src/shell/FloatingWindow.tsx (节选)
import { useHotkeys } from 'react-hotkeys-hook';

window.addEventListener('keydown', handleTabCycle, true);
window.addEventListener('keydown', handleEscapeBlurOrHide, true);
window.addEventListener('keydown', handleSinglePaneApply, true);
window.addEventListener('keydown', handleEditorFontZoom, true);
useHotkeys('meta+w', handleClose);
useHotkeys('meta+k', handleClearInput);
useHotkeys('meta+shift+l', handleRestoreLast);
```

## 5 Windows 平台差异

| 差异 | 说明 |
| --- | --- |
| accelerator 字符串 | 用 `CmdOrCtrl` 占位符；Windows 解析为 Ctrl |
| 系统托盘 | tauri tray 自动对应 Windows shell notification area |
| 权限 | 无需 Input Monitoring；全局快捷键直接可用 |
| 菜单栏图标尺寸 | Windows 用 16×16 ICO；template 概念 N/A，直接 light 主题黑 icon |
