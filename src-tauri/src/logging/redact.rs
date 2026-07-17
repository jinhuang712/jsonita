//! RedactLayer — 隐私字段脱敏 layer 占位（spec/30-operations.md § 日志与隐私）。
//!
//! 当前为 placeholder：on_event 不做任何变换。隐私保护完全依赖调用点自律
//! （经审核，现有 9 个 tracing 调用点全部只记元数据，无文档内容 / key）。
//!
//! TODO（独立聚焦任务，非本轮）：实现字段名黑名单脱敏。需注意 tracing Layer
//! 的 on_event 无法改写已记录的字段值 —— 要实现真正的脱敏须走包装型
//! MakeWriter 或 fmt-layer 的字段过滤器，而非在此 on_event 内替换。
//! 规则：`api_key` / `access_token` / `password` → 完全拒绝；
//! `content` / `text` / `body` / `raw` → 改记 `len + sha256[:8]`。

use tracing::{Event, Subscriber};
use tracing_subscriber::layer::{Context, Layer};
use tracing_subscriber::registry::LookupSpan;

pub struct RedactLayer;

impl<S> Layer<S> for RedactLayer
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_event(&self, _event: &Event<'_>, _ctx: Context<'_, S>) {
        // placeholder：不变换。见模块文档 TODO。
    }
}
