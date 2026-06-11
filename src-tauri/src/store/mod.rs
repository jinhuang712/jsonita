//! SQLite store — connection pool + migration + 业务模块。
//!
//! Spec ref: spec/10_storage.md · spec/13 § 4 SQLite schema
//! M1-N6 完成 history；M1-N7 加 session；M2 加 settings。

pub mod db;
pub mod history;
pub mod secrets;
pub mod session;
pub mod settings;
pub mod window;

pub use db::Db;
pub use settings::SettingsStore;
pub use window::{WindowState, WindowStore};
