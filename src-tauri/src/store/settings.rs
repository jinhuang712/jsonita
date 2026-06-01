//! SettingsStore ── M1-N8 default 占位起步；M2-N1 加 load(settings.json) + patch + persist。
//!
//! Spec ref: spec/10 § 7 / spec/13 § 3.3
//! 路径：~/Library/Application Support/Jsonita/settings.json

use std::path::PathBuf;
use std::sync::{Arc, RwLock};

use crate::error::JsonitaError;
use crate::types::Settings;

#[derive(Clone)]
pub struct SettingsStore {
    inner: Arc<RwLock<Settings>>,
    path: Option<PathBuf>,
}

impl SettingsStore {
    /// 启动期调用：load settings.json → default 兜底。
    pub fn load() -> Self {
        let path = default_path();
        let initial = path
            .as_ref()
            .and_then(|p| std::fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str::<Settings>(&s).ok())
            .unwrap_or_default();
        SettingsStore {
            inner: Arc::new(RwLock::new(initial)),
            path,
        }
    }

    pub fn get(&self) -> Settings {
        self.inner.read().expect("settings lock poisoned").clone()
    }

    pub fn auto_unwrap(&self) -> bool {
        self.inner
            .read()
            .expect("settings lock poisoned")
            .auto_unwrap
    }

    pub fn unwrap_timeout_ms(&self) -> u64 {
        self.inner
            .read()
            .expect("settings lock poisoned")
            .unwrap_timeout_ms
    }

    /// Shallow merge patch：传入部分 JSON object → 覆盖当前 Settings；持久化 + 返回新值。
    pub fn patch(
        &self,
        patch: serde_json::Map<String, serde_json::Value>,
    ) -> Result<Settings, JsonitaError> {
        let mut current = self.inner.write().expect("settings lock poisoned");
        let mut as_value =
            serde_json::to_value(&*current).map_err(|e| JsonitaError::Io(e.to_string()))?;
        let obj = as_value
            .as_object_mut()
            .ok_or_else(|| JsonitaError::Io("settings is not object".into()))?;
        for (k, v) in patch {
            obj.insert(k, v);
        }
        let updated: Settings =
            serde_json::from_value(as_value).map_err(|e| JsonitaError::Io(e.to_string()))?;
        *current = updated.clone();
        if let Some(path) = &self.path {
            if let Some(dir) = path.parent() {
                let _ = std::fs::create_dir_all(dir);
            }
            std::fs::write(
                path,
                serde_json::to_string_pretty(&updated).unwrap_or_default(),
            )?;
        }
        Ok(updated)
    }

    /// 恢复出厂 + 落盘。
    pub fn reset(&self) -> Result<Settings, JsonitaError> {
        let updated = Settings::default();
        {
            let mut current = self.inner.write().expect("settings lock poisoned");
            *current = updated.clone();
        }
        if let Some(path) = &self.path {
            std::fs::write(
                path,
                serde_json::to_string_pretty(&updated).unwrap_or_default(),
            )?;
        }
        Ok(updated)
    }
}

impl Default for SettingsStore {
    fn default() -> Self {
        Self::load()
    }
}

fn default_path() -> Option<PathBuf> {
    let base = dirs::data_dir()?;
    Some(base.join("Jsonita").join("settings.json"))
}
