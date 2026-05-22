//! window.json 持久化 ── width / height / userDragged。
//!
//! Spec ref: spec/06 § 7.3 持久化字段 · spec/13 § 5.2

use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};

use crate::error::JsonitaError;

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
