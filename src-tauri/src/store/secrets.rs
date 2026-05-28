//! Plain-file secrets store.
//!
//! 路径：`~/Library/Application Support/Jsonita/secrets.json`（macOS）
//! 文件 chmod 600，进程内 OnceLock + Mutex 缓存，避免反复读盘。
//! 安全权衡：相比系统凭据库失去 OS 加密；换来无弹窗、无 codesign 依赖、dev rebuild 不丢。
//! 对个人本地工具足够（数据目录已是 per-user 隔离）。

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::{Mutex, OnceLock};

use crate::error::JsonitaError;

type SecretsMap = HashMap<String, String>;

fn path() -> Option<PathBuf> {
    dirs::data_dir().map(|d| d.join("Jsonita").join("secrets.json"))
}

fn cell() -> &'static Mutex<SecretsMap> {
    static CELL: OnceLock<Mutex<SecretsMap>> = OnceLock::new();
    CELL.get_or_init(|| Mutex::new(load()))
}

fn load() -> SecretsMap {
    path()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save(map: &SecretsMap) -> Result<(), JsonitaError> {
    let Some(p) = path() else { return Ok(()); };
    if let Some(parent) = p.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let json = serde_json::to_string_pretty(map)
        .map_err(|e| JsonitaError::Secrets(e.to_string()))?;
    std::fs::write(&p, json).map_err(|e| JsonitaError::Secrets(e.to_string()))?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&p, std::fs::Permissions::from_mode(0o600))
            .map_err(|e| JsonitaError::Secrets(e.to_string()))?;
    }
    Ok(())
}

pub fn set(account: &str, value: &str) -> Result<(), JsonitaError> {
    let mut map = cell().lock().expect("secrets lock poisoned");
    map.insert(account.to_string(), value.to_string());
    save(&map)
}

pub fn get(account: &str) -> Result<Option<String>, JsonitaError> {
    let map = cell().lock().expect("secrets lock poisoned");
    Ok(map.get(account).cloned())
}

pub fn delete(account: &str) -> Result<(), JsonitaError> {
    let mut map = cell().lock().expect("secrets lock poisoned");
    map.remove(account);
    save(&map)
}
