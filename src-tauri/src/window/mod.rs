//! Window runtime — NSPanel-like 浮窗管理。
//!
//! Spec ref: `spec/06_window.html` § 2-5 生命周期 / § 9 多屏定位
//! M0-N3 范围：promote 主窗口为 NSPanel + 失焦 hide + close intercept + 多屏定位；
//! 不含智能宽度（属 M1-N9）、动效（CSS 由 M3-N1 落地）。

#[cfg(target_os = "macos")]
mod nspanel;
mod locate;

use tauri::{AppHandle, Manager, WebviewWindow};

pub const MAIN_LABEL: &str = "main";

/// 启动时调一次：把主窗口转为 NSPanel + 装事件钩子。
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let win = app
        .get_webview_window(MAIN_LABEL)
        .expect("main window missing at startup — check tauri.conf.json label=main");

    #[cfg(target_os = "macos")]
    nspanel::promote(&win)?;

    install_window_events(&win);
    Ok(())
}

/// 由 tray:toggle event / 全局快捷键（M0-N4）调用。
pub fn toggle(app: &AppHandle) -> tauri::Result<()> {
    let Some(win) = app.get_webview_window(MAIN_LABEL) else {
        return Ok(()); // 静默 no-op；启动期间 win 还没就位时可能命中
    };
    if win.is_visible()? {
        win.hide()?;
    } else {
        let _ = locate::position_for_cursor(&win);
        win.show()?;
        win.set_focus()?;
    }
    Ok(())
}

/// CloseRequested → 拦截改 hide；Focused(false) → 失焦 hide；Resized → mark userDragged。
fn install_window_events(win: &WebviewWindow) {
    let w = win.clone();
    win.on_window_event(move |event| match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            let _ = w.hide();
        }
        tauri::WindowEvent::Focused(false) => {
            // M2-N1 起按 settings.hide_on_blur 判读；M0 默认开
            let _ = w.hide();
        }
        tauri::WindowEvent::Resized(size) => {
            // M1-N9：用户拖动 → mark userDragged；自身 resize（智能宽度）走 begin/end_self_resize 跳过
            if let Some(store) = w.try_state::<crate::store::WindowStore>() {
                if !store.is_self_resizing() {
                    let _ = store.mark_user_dragged(size.width, size.height);
                }
            }
        }
        _ => {}
    });
}
