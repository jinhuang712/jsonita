//! IPC command handlers ── 按资源分组，见 spec/S02-ipc-boundary.md。
//!
//! M1-N1 阶段为 stubs ── 返回 mock 数据让前端组件可独立开发；
//! M1-N2..N9 起逐项替换为真实实现。

pub mod ai;
pub mod history;
pub mod json;
pub mod settings;
pub mod system;
pub mod window;
