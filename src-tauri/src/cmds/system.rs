//! system 分组 ── Finder 打开 / GitHub / 退出，见 CLAUDE.md 契约段。

use crate::error::JsonitaError;

const GITHUB_URL: &str = "https://github.com/jinhuang712/jsonita";

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
