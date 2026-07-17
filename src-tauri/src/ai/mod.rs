//! AI client — 多协议 HTTP wrapper（OpenAI 兼容 / Anthropic），见 spec/20-architecture.md。
//!
//! Layer 分离：provider 处理网络 + 协议分派 + 状态机；prompt 纯字符串模板；
//! validate 抽取 + 二次验证。fix() 走主流程；test_connection() 单独短超时。

pub mod prompt;
pub mod provider;
pub mod validate;
