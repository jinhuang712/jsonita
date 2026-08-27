#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod ai;
mod cmds;
mod engine;
mod error;
mod logging;
mod menubar;
mod shortcuts;
mod store;
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
            // M0-N4 既有 + M2-N5 shortcut_register
            shortcuts::shortcut_status,
            shortcuts::shortcut_retry,
            shortcuts::open_accessibility_settings,
            shortcuts::shortcut_register,
            // M1-N2: json_ops (real engine impl)
            cmds::json::json_format,
            cmds::json::json_minify,
            cmds::json::json_unwrap_stringified,
            cmds::json::json_stringify,
            cmds::json::json_parse,
            // M1-N1 stubs: history (M1-N6 真实) + M2-N4 history_add
            cmds::history::history_list,
            cmds::history::history_search,
            cmds::history::history_star,
            cmds::history::history_clear,
            cmds::history::history_add,
            // M1-N1 stubs: window
            cmds::window::window_show,
            cmds::window::window_hide,
            cmds::window::window_toggle,
            cmds::window::window_resize_for_content,
            cmds::window::window_reset_size,
            cmds::window::window_set_theme,
            // M1-N1 stubs: system
            cmds::system::open_log_dir,
            cmds::system::open_db_path,
            cmds::system::open_github,
            cmds::system::open_zen,
            cmds::system::open_openrouter,
            cmds::system::quit_app,
            // M2-N1: settings (real load/patch/persist)
            cmds::settings::settings_get_all,
            cmds::settings::settings_set,
            cmds::settings::settings_reset,
            // AI API key lives in secrets.json; test connection validates without saving.
            cmds::ai::ai_set_api_key,
            cmds::ai::ai_delete_api_key,
            cmds::ai::ai_test_connection,
            cmds::ai::ai_has_api_key,
            cmds::ai::ai_list_zen_models,
            cmds::ai::ai_list_zen_free_models,
            cmds::ai::ai_test_zen_connection,
            cmds::ai::ai_list_openrouter_models,
            cmds::ai::ai_list_openrouter_free_models,
            // M2-N3: ai fix (real DeepSeek HTTP) + Zen free
            cmds::ai::ai_fix,
        ])
        .setup(|app| {
            // macOS: 让 Dock 不出现图标（design/overview.md § 1.4 等效 LSUIElement）
            #[cfg(target_os = "macos")]
            {
                use tauri::ActivationPolicy;
                let _ = app.set_activation_policy(ActivationPolicy::Accessory);
            }

            // SQLite store ── 注入 Option<Db>：打开失败或 data dir 不可用时降级为 None，
            // history 命令返回可读的 Sqlite 错误，而非让 State<Db> 提取 panic
            // 使相关命令整体假死。核心 JSON 功能不依赖 DB。
            let db: Option<store::Db> = match store::db::default_db_path() {
                Some(db_path) => match store::Db::open(&db_path) {
                    Ok(db) => {
                        tracing::info!(path = %db_path.display(), "db.open");
                        Some(db)
                    }
                    Err(e) => {
                        tracing::error!(error = %e, path = %db_path.display(), "db.open.failed");
                        None
                    }
                },
                None => {
                    tracing::error!("db.open.failed: data dir unavailable");
                    None
                }
            };
            app.manage(db);

            // Settings store ── M1-N8 起 default 占位；M2-N1 加 load(settings.json)
            app.manage(store::SettingsStore::load());

            // Window store ── M1-N9 智能缩放：load window.json → app.manage（window_resize_for_content 走 State<WindowStore>）
            app.manage(store::WindowStore::load());

            menubar::build(app.handle())?;
            window::setup(app.handle())?;
            if let Some(win) = app.get_webview_window(window::MAIN_LABEL) {
                let window_store = app.state::<store::WindowStore>();
                let persisted = window_store.get();
                // 持久化尺寸可能因旧版物理/逻辑像素混淆而远超屏幕（如 3804×2410）；
                // 超出主屏逻辑尺寸则重置回默认，并回写 window.json 自愈。
                let screen = app
                    .primary_monitor()
                    .ok()
                    .flatten()
                    .map(|m| {
                        let scale = m.scale_factor();
                        (
                            (m.size().width as f64 / scale).round() as u32,
                            (m.size().height as f64 / scale).round() as u32,
                        )
                    })
                    .unwrap_or((0, 0));
                let st = store::clamp_to_screen(persisted.clone(), screen.0, screen.1);
                if st.width != persisted.width || st.height != persisted.height {
                    let _ = window_store.set(st.clone());
                }
                window_store.begin_self_resize();
                let _ = win.set_size(tauri::LogicalSize::new(st.width as f64, st.height as f64));
                let _ = win.center();
                // Windows：托盘型悬浮窗不应出现在任务栏 / Alt+Tab；macOS 是 LSUIElement 自动隐藏 Dock 图标。
                #[cfg(target_os = "windows")]
                let _ = win.set_skip_taskbar(true);
                let resize_guard = window_store.inner().clone();
                tauri::async_runtime::spawn(async move {
                    tokio::time::sleep(std::time::Duration::from_millis(250)).await;
                    resize_guard.end_self_resize();
                });
            }

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
