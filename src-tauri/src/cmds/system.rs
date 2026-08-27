//! system 分组 ── Finder 打开 / GitHub / 退出，见 CLAUDE.md 契约段。

use crate::error::JsonitaError;

const GITHUB_URL: &str = "https://github.com/jinhuang712/jsonita";
const ZEN_URL: &str = "https://opencode.ai/zen";
const OPENROUTER_URL: &str = "https://openrouter.ai";

#[tauri::command]
pub fn open_log_dir() -> Result<(), JsonitaError> {
    #[cfg(target_os = "macos")]
    {
        if let Some(home) = dirs::home_dir() {
            let path = home.join("Library").join("Logs").join("Jsonita");
            let _ = std::process::Command::new("open").arg(&path).spawn();
        }
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(path) = dirs::data_local_dir() {
            let path = path.join("Jsonita").join("logs");
            let _ = std::process::Command::new("explorer").arg(&path).spawn();
        }
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(home) = dirs::home_dir() {
            let path = home.join(".local").join("share").join("Jsonita");
            let _ = std::process::Command::new("xdg-open").arg(&path).spawn();
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
    #[cfg(target_os = "windows")]
    {
        // DB/secrets 存 data_dir()（Windows 上 = %APPDATA%\Jsonita），与 store/db.rs default_db_path 对齐。
        if let Some(path) = dirs::data_dir() {
            let path = path.join("Jsonita");
            let _ = std::process::Command::new("explorer").arg(&path).spawn();
        }
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        if let Some(home) = dirs::home_dir() {
            let path = home.join(".local").join("share").join("Jsonita");
            let _ = std::process::Command::new("xdg-open").arg(&path).spawn();
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
pub fn open_openrouter() -> Result<(), JsonitaError> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(OPENROUTER_URL).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", OPENROUTER_URL])
            .spawn();
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let _ = std::process::Command::new("xdg-open").arg(OPENROUTER_URL).spawn();
    }
    Ok(())
}

#[tauri::command]
pub fn open_zen() -> Result<(), JsonitaError> {
    #[cfg(target_os = "macos")]
    {
        let _ = std::process::Command::new("open").arg(ZEN_URL).spawn();
    }
    #[cfg(target_os = "windows")]
    {
        let _ = std::process::Command::new("cmd")
            .args(["/C", "start", "", ZEN_URL])
            .spawn();
    }
    #[cfg(all(unix, not(target_os = "macos")))]
    {
        let _ = std::process::Command::new("xdg-open").arg(ZEN_URL).spawn();
    }
    Ok(())
}

#[tauri::command]
pub fn quit_app(app: tauri::AppHandle) {
    app.exit(0);
}
