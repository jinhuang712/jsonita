//! window.json 持久化 ── width / height / userDragged。
//!
//! Spec ref: design/06_window.md 与 spec/S05-storage-session.md。

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};

use crate::error::JsonitaError;

const MIN_PERSISTED_WIDTH: u32 = 680;
const MIN_PERSISTED_HEIGHT: u32 = 380;
const MIN_AUTO_WIDTH: u32 = 680;
const MIN_AUTO_HEIGHT: u32 = 380;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowState {
    pub width: u32,
    pub height: u32,
    pub user_dragged: bool,
}

impl Default for WindowState {
    fn default() -> Self {
        WindowState {
            width: 680,
            height: 380,
            user_dragged: false,
        }
    }
}

#[derive(Clone)]
pub struct WindowStore {
    state: Arc<RwLock<WindowState>>,
    self_resizing: Arc<AtomicBool>,
    path: Option<PathBuf>,
}

impl WindowStore {
    pub fn load() -> Self {
        let path = default_path();
        let state = path
            .as_ref()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str::<WindowState>(&s).ok())
            .map(sanitize_loaded_state)
            .unwrap_or_default();
        WindowStore {
            state: Arc::new(RwLock::new(state)),
            self_resizing: Arc::new(AtomicBool::new(false)),
            path,
        }
    }

    pub fn get(&self) -> WindowState {
        self.state.read().unwrap_or_else(|e| e.into_inner()).clone()
    }

    pub fn set(&self, st: WindowState) -> Result<(), JsonitaError> {
        {
            let mut w = self.state.write().unwrap_or_else(|e| e.into_inner());
            *w = st.clone();
        }
        if let Some(path) = &self.path {
            if let Some(dir) = path.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            let json = serde_json::to_string_pretty(&st)
                .map_err(|e| JsonitaError::Io(e.to_string()))?;
            std::fs::write(path, json)?;
        }
        Ok(())
    }

    pub fn mark_user_dragged(&self, width: u32, height: u32) -> Result<(), JsonitaError> {
        self.set(WindowState {
            width,
            height,
            user_dragged: true,
        })
    }

    pub fn reset(&self) -> Result<(), JsonitaError> {
        if let Some(p) = &self.path {
            let _ = std::fs::remove_file(p);
        }
        let mut w = self.state.write().unwrap_or_else(|e| e.into_inner());
        *w = WindowState::default();
        Ok(())
    }

    pub fn begin_self_resize(&self) {
        self.self_resizing.store(true, Ordering::SeqCst);
    }
    pub fn end_self_resize(&self) {
        self.self_resizing.store(false, Ordering::SeqCst);
    }
    pub fn is_self_resizing(&self) -> bool {
        self.self_resizing.load(Ordering::SeqCst)
    }
}

fn default_path() -> Option<PathBuf> {
    let base = dirs::data_dir()?;
    Some(base.join("Jsonita").join("window.json"))
}

fn sanitize_loaded_state(state: WindowState) -> WindowState {
    if !state.user_dragged && (state.width < MIN_AUTO_WIDTH || state.height < MIN_AUTO_HEIGHT) {
        return WindowState::default();
    }

    WindowState {
        width: state.width.max(MIN_PERSISTED_WIDTH),
        height: state.height.max(MIN_PERSISTED_HEIGHT),
        user_dragged: state.user_dragged,
    }
}

/// 持久化尺寸超出屏幕时重置为默认。
///
/// 旧版 Resized 事件把物理像素当逻辑像素存入 window.json（Retina 屏存 2× 值，
/// 如 3804×2410），启动时 `set_size(LogicalSize)` 会把窗口撑到远超屏幕。
/// 夹到屏幕边仍是"占满全屏"的体验，故超出即重置回默认浮动尺寸。
/// 屏幕尺寸未知（0）时不干预，交由 `sanitize_loaded_state` 的下限夹取兜底。
pub fn clamp_to_screen(state: WindowState, screen_w: u32, screen_h: u32) -> WindowState {
    if screen_w > 0 && screen_h > 0 && (state.width > screen_w || state.height > screen_h) {
        return WindowState::default();
    }
    state
}

#[cfg(test)]
mod tests {
    use super::{clamp_to_screen, sanitize_loaded_state, WindowState};

    #[test]
    fn resets_old_auto_size_below_comfort_floor() {
        let state = sanitize_loaded_state(WindowState {
            width: 380,
            height: 360,
            user_dragged: false,
        });

        assert_eq!(state.width, 680);
        assert_eq!(state.height, 380);
        assert!(!state.user_dragged);
    }

    #[test]
    fn clamps_user_dragged_state_to_hard_minimum() {
        let state = sanitize_loaded_state(WindowState {
            width: 380,
            height: 320,
            user_dragged: true,
        });

        assert_eq!(state.width, 680);
        assert_eq!(state.height, 380);
        assert!(state.user_dragged);
    }

    #[test]
    fn clamp_to_screen_resets_oversized_state() {
        // 旧版物理/逻辑像素混淆留下的脏值（Retina 2×）：超出屏幕 → 重置默认。
        let state = clamp_to_screen(
            WindowState {
                width: 3804,
                height: 2410,
                user_dragged: true,
            },
            1440,
            900,
        );

        assert_eq!(state.width, 680);
        assert_eq!(state.height, 380);
        assert!(!state.user_dragged);
    }

    #[test]
    fn clamp_to_screen_keeps_state_within_screen() {
        let state = clamp_to_screen(
            WindowState {
                width: 800,
                height: 500,
                user_dragged: true,
            },
            1440,
            900,
        );

        assert_eq!(state.width, 800);
        assert_eq!(state.height, 500);
        assert!(state.user_dragged);
    }

    #[test]
    fn clamp_to_screen_ignores_unknown_screen() {
        // 屏幕尺寸未知时不干预，避免误重置合法值。
        let state = clamp_to_screen(
            WindowState {
                width: 3804,
                height: 2410,
                user_dragged: true,
            },
            0,
            0,
        );

        assert_eq!(state.width, 3804);
    }
}
