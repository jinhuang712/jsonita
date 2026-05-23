//! Menubar tray + native menu.
//!
//! Spec ref: `spec/07_menubar.html` § 1 tray API · § 2 menu 结构 · § 3 macOS 跨平台
//! Mockup ref: `spec/01_mockups.html` § 3 菜单栏 tray（light/dark 对照）
//! Icon ref: `spec/05_icons_theme.html` § 3 menubar template
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
    let icon = tauri::include_image!(
        "../assets/icons/menubar/jsonita-menubar-template-22@2x.png"
    );

    let menu = build_menu(app)?;

    let tray = TrayIconBuilder::with_id("main")
        .icon(icon)
        .icon_as_template(cfg!(target_os = "macos"))
        .tooltip("Jsonita")
        .menu(&menu)
        .menu_on_left_click(false)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(handle_tray_event)
        .on_menu_event(handle_menu_event)
        .build(app)?;

    app.manage(tray);
    Ok(())
}

fn build_menu(app: &AppHandle) -> tauri::Result<Menu<tauri::Wry>> {
    let toggle = MenuItem::with_id(app, "toggle", "Toggle Jsonita", true, None::<&str>)?;
    // Settings 项 M2-N1 实化；M0 暂 disabled 留位（spec/07 § 1.1）
    let settings = MenuItem::with_id(app, "settings", "Settings…", false, Some("CmdOrCtrl+,"))?;
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
            // M2-N1 起 emit open_settings_modal
        }
        "quit" => app.exit(0),
        _ => {}
    }
}
