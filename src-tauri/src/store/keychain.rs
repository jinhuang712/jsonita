//! Keychain wrapper ── service id = `com.jsonita.app`（spec/10 § 6）。
//!
//! v1 仅 deepseek_api_key；预留 openai_api_key 等 v2 多 provider。
//! M1+ 阶段不允许 API key 出现在 settings.json / log / event payload（spec/13 § 6）。

use crate::error::JsonitaError;

pub const SERVICE: &str = "com.jsonita.app";

#[cfg(target_os = "macos")]
mod imp {
    use super::*;
    use security_framework::passwords::{
        delete_generic_password, get_generic_password, set_generic_password,
    };

    pub fn set(account: &str, value: &str) -> Result<(), JsonitaError> {
        set_generic_password(SERVICE, account, value.as_bytes())
            .map_err(|e| JsonitaError::Keychain(e.to_string()))
    }

    pub fn get(account: &str) -> Result<Option<String>, JsonitaError> {
        match get_generic_password(SERVICE, account) {
            Ok(bytes) => Ok(Some(
                String::from_utf8(bytes).map_err(|e| JsonitaError::Keychain(e.to_string()))?,
            )),
            // NoEntry → None（首次启动正常）
            Err(e) if e.code() == -25300 => Ok(None),
            Err(e) => Err(JsonitaError::Keychain(e.to_string())),
        }
    }

    pub fn delete(account: &str) -> Result<(), JsonitaError> {
        match delete_generic_password(SERVICE, account) {
            Ok(()) => Ok(()),
            Err(e) if e.code() == -25300 => Ok(()), // 幂等
            Err(e) => Err(JsonitaError::Keychain(e.to_string())),
        }
    }
}

#[cfg(not(target_os = "macos"))]
mod imp {
    use super::*;
    /// Windows / Linux stub —— M3-N5 / D-N4 时换 Windows Credential Manager / libsecret。
    pub fn set(_account: &str, _value: &str) -> Result<(), JsonitaError> {
        Err(JsonitaError::Keychain("not supported on this platform".into()))
    }
    pub fn get(_account: &str) -> Result<Option<String>, JsonitaError> {
        Ok(None)
    }
    pub fn delete(_account: &str) -> Result<(), JsonitaError> {
        Ok(())
    }
}

pub use imp::{delete, get, set};
