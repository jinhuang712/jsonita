//! Menubar tray + native menu.
//!
//! Spec ref: `design/07_menubar.md` § 1 tray API · § 2 menu 结构 · § 3 macOS 跨平台
//! Mockup ref: `design/01_mockups.md` § 3 菜单栏 tray（light/dark 对照）
//! Icon ref: `design/05_icons_theme.md` § 3 menubar template
//!
//! M0-N2 范围：装好 tray + 原生菜单 + 事件钩子；
//! 不接 浮窗 toggle 实现（属 M0-N3）— 这里只 `emit("tray:toggle", ())`。
//! 也不接 Settings Modal 实现（属 M2-N1）— 菜单项暂 disabled。

use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager,
};

pub fn build(app: &AppHandle) -> tauri::Result<()> {
    // macOS template @2x PNG 编译期 PNG → RGBA decode 嵌入（Tauri 2 include_image! 宏处理）
    let icon = tauri::include_image!("../assets/icons/menubar/jsonita-menubar-template-22@2x.png");

    let menu = build_menu(app)?;

    let tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(cfg!(target_os = "macos"))
        .tooltip("Jsonita")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(handle_tray_event)
        .on_menu_event(handle_menu_event)
        .build(app)?;

    app.manage(tray);
    Ok(())
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let toggle = MenuItem::with_id(app, "toggle", "Toggle Jsonita", true, None::<&str>)?;
    // M2-N1 解锁：点击 → 显示浮窗 + emit tray:open-settings 让前端打开 Modal
    let settings = MenuItem::with_id(app, "settings", "Settings…", true, Some("CmdOrCtrl+,"))?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "Quit Jsonita", true, Some("CmdOrCtrl+Q"))?;

    Menu::with_items(app, &[&toggle, &settings, &sep, &quit])
}

fn handle_tray_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
    } = event
    {
        // M0-N3 起监听这个事件接窗口 toggle
        let _ = tray.app_handle().emit("tray:toggle", ());
    }
}

fn handle_menu_event(app: &AppHandle, event: tauri::menu::MenuEvent) {
    match event.id.as_ref() {
        "toggle" => {
            let _ = app.emit("tray:toggle", ());
        }
        "settings" => {
            // M2-N1: 先呼出浮窗（隐藏态时），再让前端打开 Settings Modal
            let _ = crate::window::toggle_show_only(app);
            let _ = app.emit("tray:open-settings", ());
        }
        "quit" => app.exit(0),
        _ => {}
    }
}
