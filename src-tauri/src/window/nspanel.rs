//! cocoa unsafe — 把 NSWindow 升级为 NSPanel-like 行为。
//!
//! Spec ref: `spec/06_window.html` § 3 NSPanel 标志位详解
//! 关键 3 个 setter：styleMask / collectionBehavior / level
//!
//! cocoa 0.26 已全面 deprecated（建议改 objc2-app-kit），但 Tauri 2.11 内部
//! 仍依赖 cocoa；M3 polish 时若迁 objc2 再去掉 allow。

#![cfg(target_os = "macos")]
#![allow(deprecated)] // cocoa 0.26 整体 deprecated 但 Tauri 2.11 仍依赖

use cocoa::appkit::{NSColor, NSWindow, NSWindowCollectionBehavior, NSWindowStyleMask};
use cocoa::base::{id, nil, NO};
use objc::{msg_send, sel, sel_impl};
use tauri::WebviewWindow;

/// NSWindow level: floating = 3（等效 `.floating`）。
const NS_FLOATING_LEVEL: i64 = 3;

pub fn promote(win: &WebviewWindow) -> tauri::Result<()> {
    let raw = win.ns_window()?;
    let ns_window = raw as id;

    unsafe {
        // styleMask: titled + fullSizeContentView + nonactivatingPanel
        // .nonactivatingPanel 让 panel 接收点击但不切换前台 App 焦点（关键）
        // cocoa 0.26 不直接含 NSNonactivatingPanelMask 常量 → 走 from_bits_retain(1 << 7)
        let mask = NSWindowStyleMask::NSTitledWindowMask
            | NSWindowStyleMask::NSFullSizeContentViewWindowMask
            | NSWindowStyleMask::from_bits_retain(1 << 7);
        ns_window.setStyleMask_(mask);

        // collectionBehavior:
        // - canJoinAllSpaces: 切 Space 后仍可见
        // - stationary: Mission Control 中不被作为窗口堆叠
        // - fullScreenAuxiliary: 在其他 App fullscreen 上方仍可见
        let collection = NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
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
