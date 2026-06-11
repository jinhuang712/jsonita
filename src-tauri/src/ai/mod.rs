//! AI client — DeepSeek HTTP wrapper，见 spec/M02-ai-repair.md。
//!
//! Layer 分离：deepseek 处理网络 + 状态机；prompt 纯字符串模板；
//! validate 抽取 + 二次验证。fix() 走主流程；test_connection() 单独短超时。

pub mod deepseek;
pub mod prompt;
pub mod validate;
