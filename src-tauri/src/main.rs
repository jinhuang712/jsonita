#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod menubar;
mod shortcuts;
mod window;

use tauri::{Listener, Manager};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            shortcuts::shortcut_status,
            shortcuts::shortcut_retry,
            shortcuts::open_accessibility_settings,
        ])
        .setup(|app| {
            // macOS: 让 Dock 不出现图标（spec/07 § 1.4 等效 LSUIElement）
            #[cfg(target_os = "macos")]
            {
                use tauri::ActivationPolicy;
                let _ = app.set_activation_policy(ActivationPolicy::Accessory);
            }

            menubar::build(app.handle())?;
            window::setup(app.handle())?;

            // tray:toggle event → 浮窗 toggle（M0-N2 emit · M0-N3 接）
            let toggle_app = app.handle().clone();
            app.listen("tray:toggle", move |_event| {
                let _ = window::toggle(&toggle_app);
            });

            // 注册 ⌘⇧J；失败不阻塞启动（M0-N4：权限缺失走前端引导 Modal）
            if let Err(e) = shortcuts::register_defaults(app.handle()) {
                eprintln!("[shortcuts] register_defaults failed: {}", e);
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
