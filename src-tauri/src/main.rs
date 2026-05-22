#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod menubar;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // macOS: 让 Dock 不出现图标（LSUIElement 等效，spec/07 § 1.4）
            #[cfg(target_os = "macos")]
            {
                use tauri::ActivationPolicy;
                let _ = app.set_activation_policy(ActivationPolicy::Accessory);
            }

            menubar::build(app.handle())?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
