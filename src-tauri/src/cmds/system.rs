//! system 分组 stubs ── 全局快捷键 / 剪贴板 / Finder 打开，见 spec/03_ipc_boundary.md。
//!
//! M1-N1：clipboard_read 走 tauri-plugin-clipboard-manager（v2）→ 留 M1-N2 加；
//! 当前返回空 sniff。open_log_dir / open_db_path 走 std::process::Command spawn。
//! shortcut_register 由 M2-N5 真实化（M0-N4 已有 retry/status/open_accessibility 三命令）。

use crate::error::JsonitaError;
use crate::types::ClipboardSniff;

const GITHUB_URL: &str = "https://github.com/jinhuang712/jsonita";

#[tauri::command]
pub async fn clipboard_read() -> Result<ClipboardSniff, JsonitaError> {
    // M1-N2 替换：tauri-plugin-clipboard-manager read_text + sniff JSON
    Ok(ClipboardSniff {
        text: String::new(),
        looks_like_json: false,
    })
}

#[tauri::command]
pub fn open_log_dir() -> Result<(), JsonitaError> {
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let path = home.join("Library").join("Logs").join("Jsonita");
            let _ = std::process::Command::new("open").arg(&path).spawn();
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_db_path() -> Result<(), JsonitaError> {
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let path = home
                .join("Library")
                .join("Application Support")
                .join("Jsonita");
            let _ = std::process::Command::new("open").arg(&path).spawn();
        }
    }
    Ok(())
}

#[tauri::command]
pub fn open_github() -> Result<(), JsonitaError> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(GITHUB_URL).spawn();
    }

    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", GITHUB_URL])
            .spawn();
    }

    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let _ = std::process::Command::new("xdg-open")
            .arg(GITHUB_URL)
            .spawn();
    }

    Ok(())
}

#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}
