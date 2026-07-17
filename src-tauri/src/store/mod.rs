//! SQLite store — connection pool + migration + 业务模块。
//!
//! Spec ref: CLAUDE.md 契约段。
//! M1-N6 完成 history；M2 加 settings。

pub mod db;
pub mod history;
pub mod secrets;
pub mod settings;
pub mod window;

pub use db::Db;
pub use settings::SettingsStore;
pub use window::{clamp_to_screen, WindowState, WindowStore};
