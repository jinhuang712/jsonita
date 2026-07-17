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
    // 路径不可解析 → 无法持久化，必须报错而非静默成功（否则重启后 key 消失、上游却以为写入了）。
    let Some(p) = path() else {
        return Err(JsonitaError::Secrets(
            "secrets path unavailable (data dir not resolvable)".into(),
        ));
    };
    if let Some(parent) = p.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let json =
        serde_json::to_string_pretty(map).map_err(|e| JsonitaError::Secrets(e.to_string()))?;
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
    let mut map = cell().lock().unwrap_or_else(|e| e.into_inner());
    let previous = map.insert(account.to_string(), value.to_string());
    if let Err(e) = save(&map) {
        // 落盘失败 → 回滚内存，保持内存与磁盘一致（避免 ai_has_api_key 当场 true、重启后落空）。
        match previous {
            Some(prev) => {
                map.insert(account.to_string(), prev);
            }
            None => {
                map.remove(account);
            }
        }
        return Err(e);
    }
    Ok(())
}

pub fn get(account: &str) -> Result<Option<String>, JsonitaError> {
    let map = cell().lock().unwrap_or_else(|e| e.into_inner());
    Ok(map.get(account).cloned())
}

pub fn delete(account: &str) -> Result<(), JsonitaError> {
    let mut map = cell().lock().unwrap_or_else(|e| e.into_inner());
    let previous = map.remove(account);
    if let Err(e) = save(&map) {
        // 落盘失败 → 回滚内存删除，保持一致。
        if let Some(prev) = previous {
            map.insert(account.to_string(), prev);
        }
        return Err(e);
    }
    Ok(())
}
