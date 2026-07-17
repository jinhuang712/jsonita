//! cocoa unsafe — 把 NSWindow 升级为 NSPanel-like 行为。
//!
//! Spec ref: `design/overview.md` § 3 NSPanel 标志位详解
//! 关键 3 个 setter：styleMask / collectionBehavior / level
//!
//! cocoa 0.26 已全面 deprecated（建议改 objc2-app-kit），但 Tauri 2.11 内部
//! 仍依赖 cocoa；M3 polish 时若迁 objc2 再去掉 allow。

#![cfg(target_os = "macos")]
#![allow(deprecated)] // cocoa 0.26 整体 deprecated 但 Tauri 2.11 仍依赖

use cocoa::appkit::{
    NSColor, NSWindow, NSWindowButton, NSWindowCollectionBehavior, NSWindowStyleMask,
    NSWindowTitleVisibility,
};
use cocoa::base::{id, nil, BOOL, NO, YES};
use cocoa::foundation::NSString;
use objc::{class, msg_send, sel, sel_impl};
use tauri::WebviewWindow;

/// NSWindow level: floating = 3（等效 `.floating`）。
const NS_FLOATING_LEVEL: i64 = 3;

pub fn promote(win: &WebviewWindow) -> tauri::Result<()> {
    let raw = win.ns_window()?;
    let ns_window = raw as id;

    unsafe {
        // styleMask: titled + resizable + fullSizeContentView + nonactivatingPanel
        // .nonactivatingPanel 让 panel 接收点击但不切换前台 App 焦点（关键）
        // cocoa 0.26 不直接含 NSNonactivatingPanelMask 常量 → 走 from_bits_retain(1 << 7)
        let mask = NSWindowStyleMask::NSTitledWindowMask
            | NSWindowStyleMask::NSResizableWindowMask
            | NSWindowStyleMask::NSFullSizeContentViewWindowMask
            | NSWindowStyleMask::from_bits_retain(1 << 7);
        ns_window.setStyleMask_(mask);
        ns_window.setTitleVisibility_(NSWindowTitleVisibility::NSWindowTitleHidden);
        ns_window.setTitlebarAppearsTransparent_(YES);
        hide_standard_window_buttons(ns_window);

        // collectionBehavior:
        // - moveToActiveSpace: 快捷键唤起时移到当前 Space，不跳回旧桌面
        // - stationary: Mission Control 中不被作为窗口堆叠
        // - fullScreenAuxiliary: 在其他 App fullscreen 上方仍可见
        let collection = NSWindowCollectionBehavior::NSWindowCollectionBehaviorMoveToActiveSpace
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
            | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary;
        ns_window.setCollectionBehavior_(collection);

        // floating level：常驻置顶（macOS 上 NSPanel 进一步加强 alwaysOnTop）
        let _: () = msg_send![ns_window, setLevel: NS_FLOATING_LEVEL];

        // Keep the native vibrancy visible below the webview. Tauri's
        // transparent window flag normally handles this, but we re-apply it
        // after changing the NSWindow style mask so AppKit cannot restore an
        // opaque title/background surface.
        ns_window.setOpaque_(NO);
        ns_window.setBackgroundColor_(NSColor::clearColor(nil));
    }

    Ok(())
}

unsafe fn hide_standard_window_buttons(ns_window: id) {
    for button_kind in [
        NSWindowButton::NSWindowCloseButton,
        NSWindowButton::NSWindowMiniaturizeButton,
        NSWindowButton::NSWindowZoomButton,
    ] {
        let button = ns_window.standardWindowButton_(button_kind);
        if button != nil {
            let _: () = msg_send![button, setHidden: YES];
        }
    }
}

/// 窗口 appearance 模式。
/// `System` → `setAppearance: nil` 清除 override，让 NSWindow 跟随 OS ── 关键：
/// 这样系统在 app 运行时切换 light/dark 才会把 `prefers-color-scheme` 变更推给 WKWebView，
/// 同时也避免把 webview 的 matchMedia 钉死在某个具体外观（旧 bug：light→system 不变 dark）。
#[derive(Clone, Copy)]
pub enum Appearance {
    Light,
    Dark,
    System,
}

/// 设 NSWindow appearance（aqua / darkAqua / nil 跟随系统）。
/// 由 `window::apply_glass_mode` 调用；主题切换时经 `window_set_theme` command 重新应用。
pub fn set_appearance(win: &WebviewWindow, mode: Appearance) -> tauri::Result<()> {
    let raw = win.ns_window()?;
    let ns_window = raw as id;
    unsafe {
        let appearance: id = match mode {
            // nil → 清除窗口级 override，跟随 NSApp / OS
            Appearance::System => nil,
            Appearance::Light => {
                let n = NSString::alloc(nil).init_str("NSAppearanceNameAqua");
                let a: id = msg_send![class!(NSAppearance), appearanceNamed: n];
                a
            }
            Appearance::Dark => {
                let n = NSString::alloc(nil).init_str("NSAppearanceNameDarkAqua");
                let a: id = msg_send![class!(NSAppearance), appearanceNamed: n];
                a
            }
        };
        let _: () = msg_send![ns_window, setAppearance: appearance];
    }
    Ok(())
}

/// 读 OS 真实外观（`NSApp.effectiveAppearance`），system 模式解析 light/dark 用。
/// 不受 NSWindow.appearance pin 影响 ── 这是修「webview matchMedia 被钉死」根因的权威数据源。
/// 主线程调用（AppKit 约束）。
pub fn os_is_dark() -> bool {
    unsafe {
        let app: id = msg_send![class!(NSApplication), sharedApplication];
        if app == nil {
            return false;
        }
        let appearance: id = msg_send![app, effectiveAppearance];
        if appearance == nil {
            return false;
        }
        let name: id = msg_send![appearance, name];
        if name == nil {
            return false;
        }
        // 任何 dark 变体（DarkAqua / VibrantDark / accessibility 变体）名字都含 "Dark"
        let needle = NSString::alloc(nil).init_str("Dark");
        let contains: BOOL = msg_send![name, containsString: needle];
        contains == YES
    }
}
