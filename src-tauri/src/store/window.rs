//! window.json 持久化 ── width / height / userDragged。
//!
//! Spec ref: design/06_window.md 与 spec/07_storage_session.md。

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};

use crate::error::JsonitaError;

const MIN_PERSISTED_WIDTH: u32 = 440;
const MIN_PERSISTED_HEIGHT: u32 = 340;
const MIN_AUTO_WIDTH: u32 = 860;
const MIN_AUTO_HEIGHT: u32 = 560;

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
            width: 860,
            height: 560,
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
        self.state.read().expect("window store poisoned").clone()
    }

    pub fn set(&self, st: WindowState) -> Result<(), JsonitaError> {
        {
            let mut w = self.state.write().expect("window store poisoned");
            *w = st.clone();
        }
        if let Some(path) = &self.path {
            if let Some(dir) = path.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            std::fs::write(path, serde_json::to_string_pretty(&st).unwrap_or_default())?;
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
        let mut w = self.state.write().expect("window store poisoned");
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

#[cfg(test)]
mod tests {
    use super::{sanitize_loaded_state, WindowState};

    #[test]
    fn resets_old_auto_size_below_comfort_floor() {
        let state = sanitize_loaded_state(WindowState {
            width: 380,
            height: 360,
            user_dragged: false,
        });

        assert_eq!(state.width, 860);
        assert_eq!(state.height, 560);
        assert!(!state.user_dragged);
    }

    #[test]
    fn clamps_user_dragged_state_to_hard_minimum() {
        let state = sanitize_loaded_state(WindowState {
            width: 380,
            height: 320,
            user_dragged: true,
        });

        assert_eq!(state.width, 440);
        assert_eq!(state.height, 340);
        assert!(state.user_dragged);
    }
}
