#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod menubar;
mod window;

use tauri::{Listener, Manager};

fn main() {
    tauri::Builder::default()
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

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
