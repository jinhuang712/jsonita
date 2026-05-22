//! Settings store ── M1-N8 默认值占位；M2-N1 加 load(settings.json) + patch + 落盘。
//!
//! Spec ref: spec/10 § 7 / spec/13 § 3.3

use std::sync::{Arc, RwLock};

use crate::types::Settings;

#[derive(Clone)]
pub struct SettingsStore {
    inner: Arc<RwLock<Settings>>,
}

impl SettingsStore {
    pub fn new() -> Self {
        SettingsStore {
            inner: Arc::new(RwLock::new(Settings::default())),
        }
    }

    pub fn get(&self) -> Settings {
        self.inner.read().expect("settings lock poisoned").clone()
    }

    pub fn auto_unwrap(&self) -> bool {
        self.inner.read().expect("settings lock poisoned").auto_unwrap
    }

    pub fn unwrap_timeout_ms(&self) -> u64 {
        self.inner.read().expect("settings lock poisoned").unwrap_timeout_ms
    }
}

impl Default for SettingsStore {
    fn default() -> Self {
        Self::new()
    }
}
