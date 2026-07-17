//! Window runtime — NSPanel-like 浮窗管理。
//!
//! Spec ref: `design/overview.md` § 2-5 生命周期 / § 9 多屏定位
//! 当前范围：promote 主窗口为 NSPanel + 原生 vibrancy + 失焦 hide + close intercept
//! + 多屏定位；智能缩放在 cmds::window 中实现。

mod locate;
#[cfg(target_os = "macos")]
mod nspanel;

use tauri::{
    webview::Color,
    window::{Effect, EffectState, EffectsBuilder},
    AppHandle, Manager, WebviewWindow,
};

// 主题模式单一权威：crate::types::ThemeMode（serde kebab-case）。
use crate::types::ThemeMode;

#[cfg(target_os = "macos")]
use std::sync::atomic::{AtomicU64, Ordering};

pub const MAIN_LABEL: &str = "main";
// 离场比召唤快 40ms：窗口已完成使命，利落让路而非拖泥带水。
const SUMMON_MS: u64 = 150;
const DISMISS_MS: u64 = 110;
const VIBRANCY_RADIUS: f64 = 16.0;

/// 单窗显隐代际：每次 animated_hide / animated_show 自增。延迟 hide 定时器捕获自增后的值，
/// 触发时若代际已变（期间发生新的 show/hide）则放弃隐藏，避免把刚重新显示的窗口藏回去。
#[cfg(target_os = "macos")]
static WINDOW_GEN: AtomicU64 = AtomicU64::new(0);

fn emit_window_shown(app: &AppHandle) {
    let _ = tauri::Emitter::emit(app, "window:shown", ());
}

/// 整窗 alpha 淡出后再 hide()。原生 vibrancy + webview 内容作为单一合成单元一起淡出，
/// 不会出现「内容先消失、空玻璃框再消失」的两段式。reduce-motion 时直接 hide。
pub fn animated_hide(win: WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        let generation = WINDOW_GEN.fetch_add(1, Ordering::SeqCst) + 1;
        if nspanel::reduce_motion() {
            let _ = win.hide();
            return;
        }
        let _ = nspanel::fade(&win, 0.0, DISMISS_MS as f64 / 1000.0, nspanel::FadeCurve::EaseIn);
        tauri::async_runtime::spawn(async move {
            tokio::time::sleep(std::time::Duration::from_millis(DISMISS_MS)).await;
            // 期间若发生新的 show/hide，代际不符 → 放弃这次隐藏（否则会藏掉刚显示的窗口）。
            if WINDOW_GEN.load(Ordering::SeqCst) != generation {
                return;
            }
            // hide() 与 set_alpha 触及 AppKit，必须回主线程（本 spawn 跑在 async worker）。
            let native = win.clone();
            let _ = win.run_on_main_thread(move || {
                let _ = native.hide();
                // 复位 alpha，让下次 show（若跳过淡入路径）不至于停在 0。
                let _ = nspanel::set_alpha(&native, 1.0);
            });
        });
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = win.hide();
    }
}

/// 定位 → alpha 0 → show → 淡入到 1，整窗单段浮现。reduce-motion 时直接满 alpha show。
#[cfg(target_os = "macos")]
fn animated_show(win: &WebviewWindow) -> tauri::Result<()> {
    // 自增代际，作废任何未决的延迟 hide 定时器（避免召唤后立刻被上一轮 hide 藏回去）。
    WINDOW_GEN.fetch_add(1, Ordering::SeqCst);
    if nspanel::reduce_motion() {
        let _ = nspanel::set_alpha(win, 1.0);
        win.show()?;
        return Ok(());
    }
    let _ = nspanel::set_alpha(win, 0.0);
    win.show()?;
    let _ = nspanel::fade(win, 1.0, SUMMON_MS as f64 / 1000.0, nspanel::FadeCurve::EaseOut);
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn animated_show(win: &WebviewWindow) -> tauri::Result<()> {
    win.show()
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
    // 玻璃材质 + 窗口 appearance 跟随主题；启动先按 system（跟随 OS）应用，前端 useEffectiveTheme
    // 挂载后立即调 window_set_theme 用持久化 settings.theme 校正（窗口启动时隐藏，无闪烁）。
    let _ = apply_glass_mode(&win, ThemeMode::System);

    install_window_events(&win);
    Ok(())
}

#[cfg(target_os = "macos")]
fn apply_transparent_background(win: &WebviewWindow) -> tauri::Result<()> {
    win.set_background_color(Some(Color(0, 0, 0, 0)))
}

/// 玻璃 vibrancy + NSWindow appearance 跟随主题，返回解析后的 `dark`。
///
/// - light / dark：钉死对应 appearance（aqua / darkAqua）+ 对应材质。
/// - system：先经 `nspanel::os_is_dark()` 读 OS 真实外观解析 dark（权威，不靠 webview matchMedia），
///   再把 appearance 设为 nil 跟随 OS（让运行时系统主题切换能推送给 webview）；材质按解析后的 dark 选。
///
/// dark 用 HudWindow（稳定的暗模糊），light 用 Popover ── 保证半透卡片下原生模糊与 CSS 主题一致。
/// 返回值由 `window_set_theme` 回传前端，作为 effective theme 权威值。
/// 必须在主线程调用（AppKit：setAppearance / effectiveAppearance / set_effects）。
pub fn apply_glass_mode(win: &WebviewWindow, mode: ThemeMode) -> bool {
    // 先解析 dark（system 经 OS effectiveAppearance）；作为函数唯一 tail 表达式回传，
    // 下面的 cfg 块只做副作用（避免 cfg 块落在 tail 位置导致 macOS build 返回 ()）。
    let dark = match mode {
        ThemeMode::Light => false,
        ThemeMode::Dark => true,
        #[cfg(target_os = "macos")]
        ThemeMode::System => nspanel::os_is_dark(),
        #[cfg(not(target_os = "macos"))]
        ThemeMode::System => false,
    };
    #[cfg(target_os = "macos")]
    {
        let appearance = match mode {
            ThemeMode::Light => nspanel::Appearance::Light,
            ThemeMode::Dark => nspanel::Appearance::Dark,
            ThemeMode::System => nspanel::Appearance::System,
        };
        let _ = nspanel::set_appearance(win, appearance);
        let effect = if dark {
            Effect::HudWindow
        } else {
            Effect::Popover
        };
        let _ = win.set_effects(
            EffectsBuilder::new()
                .effect(effect)
                .state(EffectState::Active)
                .radius(VIBRANCY_RADIUS)
                .build(),
        );
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = win;
    }
    dark
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
        animated_show(&win)?;
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
        animated_show(&win)?;
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
            // M1-N9：用户拖动 → mark userDragged；自身 resize（智能缩放）走 begin/end_self_resize 跳过。
            // Resized 投递物理像素，持久化前须除以 scale_factor 还原逻辑像素，否则 Retina 屏会
            // 存入 2× 尺寸，下次启动 set_size(LogicalSize) 把窗口撑到全屏。
            if let Some(store) = w.try_state::<crate::store::WindowStore>() {
                if !store.is_self_resizing() {
                    let scale = w.scale_factor().ok().filter(|s| *s > 0.0).unwrap_or(1.0);
                    let _ = store.mark_user_dragged(
                        (size.width as f64 / scale).round() as u32,
                        (size.height as f64 / scale).round() as u32,
                    );
                }
            }
        }
        _ => {}
    });
}
