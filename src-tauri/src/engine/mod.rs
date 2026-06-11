//! JSON 引擎 ── Rust 端纯计算层。
//!
//! Spec ref: `spec/06_json_engine.md`
//! 所有 engine::* 函数都是纯函数（无 IO / 无 Tauri 依赖）；
//! 走 `cargo test` 可独立单测；CPU 密集调用走 `tauri::async_runtime::spawn_blocking`。

pub mod error_loc;
pub mod json;
pub mod stringify;
pub mod unwrap;
