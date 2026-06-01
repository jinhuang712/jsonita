//! Window runtime — NSPanel-like 浮窗管理。
//!
//! Spec ref: `spec/06_window.html` § 2-5 生命周期 / § 9 多屏定位
//! 当前范围：promote 主窗口为 NSPanel + 原生 vibrancy + 失焦 hide + close intercept
//! + 多屏定位；智能缩放在 cmds::window 中实现。

mod locate;
#[cfg(target_os = "macos")]
mod nspanel;

use tauri::Emitter;
use tauri::{
    webview::Color,
    window::{Effect, EffectState, EffectsBuilder},
    AppHandle, Manager, WebviewWindow,
};

pub const MAIN_LABEL: &str = "main";
const HIDE_ANIMATION_MS: u64 = 140;
const VIBRANCY_RADIUS: f64 = 16.0;

fn emit_window_shown(app: &AppHandle) {
    let _ = tauri::Emitter::emit(app, "window:shown", ());
}

pub fn animated_hide(win: WebviewWindow) {
    let _ = win.emit("window:will-hide", ());
    tauri::async_runtime::spawn(async move {
        tokio::time::sleep(std::time::Duration::from_millis(HIDE_ANIMATION_MS)).await;
        let _ = win.hide();
    });
}

/// 启动时调一次：把主窗口转为 NSPanel + 装事件钩子。
pub fn setup(app: &AppHandle) -> tauri::Result<()> {
    let win = app
        .get_webview_window(MAIN_LABEL)
        .expect("main window missing at startup — check tauri.conf.json label=main");

    #[cfg(target_os = "macos")]
    nspanel::promote(&win)?;
    #[cfg(target_os = "macos")]
    apply_transparent_background(&win)?;
    #[cfg(target_os = "macos")]
    apply_vibrancy(&win)?;

    install_window_events(&win);
    Ok(())
}

#[cfg(target_os = "macos")]
fn apply_transparent_background(win: &WebviewWindow) -> tauri::Result<()> {
    win.set_background_color(Some(Color(0, 0, 0, 0)))
}

#[cfg(target_os = "macos")]
fn apply_vibrancy(win: &WebviewWindow) -> tauri::Result<()> {
    win.set_effects(
        EffectsBuilder::new()
            .effect(Effect::Popover)
            .state(EffectState::Active)
            .radius(VIBRANCY_RADIUS)
            .build(),
    )
}

/// 由 tray:toggle event / 全局快捷键（M0-N4）调用。
pub fn toggle(app: &AppHandle) -> tauri::Result<()> {
    let Some(win) = app.get_webview_window(MAIN_LABEL) else {
        return Ok(()); // 静默 no-op；启动期间 win 还没就位时可能命中
    };
    let was_visible = win.is_visible()?;
    if was_visible {
        animated_hide(win);
        tracing::info!(action = "hide", "window.toggle");
    } else {
        let _ = locate::position_for_cursor(&win);
        win.show()?;
        win.set_focus()?;
        emit_window_shown(app);
        tracing::info!(action = "show", "window.toggle");
    }
    Ok(())
}

/// 仅显示（不切换）── tray Settings 项调用，避免"窗口本已显示再点 Settings 反而 hide"。
pub fn toggle_show_only(app: &AppHandle) -> tauri::Result<()> {
    let Some(win) = app.get_webview_window(MAIN_LABEL) else {
        return Ok(());
    };
    if !win.is_visible()? {
        let _ = locate::position_for_cursor(&win);
        win.show()?;
    }
    win.set_focus()?;
    emit_window_shown(app);
    Ok(())
}

/// CloseRequested → 拦截改 hide；Focused(false) → 失焦 hide；Resized → mark userDragged。
fn install_window_events(win: &WebviewWindow) {
    let w = win.clone();
    win.on_window_event(move |event| match event {
        tauri::WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();
            animated_hide(w.clone());
        }
        tauri::WindowEvent::Focused(false) => {
            if let Some(settings) = w.try_state::<crate::store::SettingsStore>() {
                if !settings.get().hide_on_blur {
                    return;
                }
            }
            animated_hide(w.clone());
        }
        tauri::WindowEvent::Resized(size) => {
            // M1-N9：用户拖动 → mark userDragged；自身 resize（智能缩放）走 begin/end_self_resize 跳过
            if let Some(store) = w.try_state::<crate::store::WindowStore>() {
                if !store.is_self_resizing() {
                    let _ = store.mark_user_dragged(size.width, size.height);
                }
            }
        }
        _ => {}
    });
}
