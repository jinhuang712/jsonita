//! 多屏定位 — 浮窗呼出到鼠标所在屏的水平中央、垂直上 1/3。
//!
//! Spec ref: `spec/06_window.html` § 4 多屏定位
//! - 走 cursor → find monitor → center + top 1/3
//! - 鼠标在屏外 / 单屏断开 → fallback primary monitor
//! - 用 PhysicalPosition 统一 ── monitor.position() 与 cursor_position() 都是 physical

use tauri::{Manager, PhysicalPosition, WebviewWindow};

pub fn position_for_cursor(win: &WebviewWindow) -> tauri::Result<()> {
    let app = win.app_handle();

    let cursor = match app.cursor_position() {
        Ok(p) => p,
        // 鼠标位置不可获取 → 沿用上次位置（Tauri 默认）
        Err(_) => return Ok(()),
    };

    let monitors = app.available_monitors()?;
    let monitor = monitors
        .into_iter()
        .find(|m| {
            let p = m.position();
            let s = m.size();
            cursor.x >= p.x as f64
                && cursor.x < (p.x as i64 + s.width as i64) as f64
                && cursor.y >= p.y as f64
                && cursor.y < (p.y as i64 + s.height as i64) as f64
        })
        .or_else(|| app.primary_monitor().ok().flatten());

    let Some(monitor) = monitor else {
        return Ok(());
    };

    let win_size = win.outer_size()?;
    let mp = monitor.position();
    let ms = monitor.size();

    // 水平居中
    let x = mp.x + ((ms.width as i32 - win_size.width as i32) / 2);
    // 垂直上 1/3（避免遮挡用户当前关注区域 ── spec/06 § 4.2）
    let y = mp.y + ((ms.height as i32 - win_size.height as i32) / 3);

    win.set_position(PhysicalPosition::new(x, y))?;
    Ok(())
}
