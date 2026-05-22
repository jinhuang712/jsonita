#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod cmds;
mod error;
mod logging;
mod menubar;
mod shortcuts;
mod types;
mod window;

use tauri::{Listener, Manager};

fn main() {
    // 日志先起 ── _guard 留 main local 直到 run() 返回，drop 触发 flush
    let _log_guard = logging::init();

    tracing::info!(
        version = env!("CARGO_PKG_VERSION"),
        os = std::env::consts::OS,
        arch = std::env::consts::ARCH,
        "app.start"
    );

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            // M0-N4 既有
            shortcuts::shortcut_status,
            shortcuts::shortcut_retry,
            shortcuts::open_accessibility_settings,
            // M1-N1 stubs: json_ops
            cmds::json::json_format,
            cmds::json::json_minify,
            cmds::json::json_unwrap_stringified,
            cmds::json::json_stringify,
            // M1-N1 stubs: history
            cmds::history::history_list,
            cmds::history::history_search,
            cmds::history::history_pin,
            cmds::history::history_star,
            cmds::history::history_clear,
            // M1-N1 stubs: session
            cmds::session::session_save_last,
            cmds::session::session_load_last,
            cmds::session::session_clear_last,
            // M1-N1 stubs: window
            cmds::window::window_show,
            cmds::window::window_hide,
            cmds::window::window_toggle,
            cmds::window::window_resize_for_content,
            cmds::window::window_reset_size,
            // M1-N1 stubs: system
            cmds::system::clipboard_read,
            cmds::system::open_log_dir,
            cmds::system::open_db_path,
            cmds::system::quit_app,
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
                tracing::warn!(error = %e, "shortcut.register_failed");
            } else {
                tracing::info!(action = "toggle-window", "shortcut.registered");
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
