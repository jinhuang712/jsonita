//! RedactLayer — 隐私字段脱敏 layer 占位。
//!
//! Spec ref: `spec/09_logging_observability.md` 与 `spec/appendix/logging-details.md`。
//! M0 阶段为 placeholder：规则表为空，仅在 subscriber chain 中占位。
//! M2-N3 接 API key 时填入黑名单（`api_key` / `access_token` / `password` 等
//! → 完全拒绝；`content` / `text` / `body` / `raw` → 改记 `len + sha256[:8]`）。

use tracing::{Event, Subscriber};
use tracing_subscriber::layer::{Context, Layer};
use tracing_subscriber::registry::LookupSpan;

pub struct RedactLayer;

impl<S> Layer<S> for RedactLayer
where
    S: Subscriber + for<'a> LookupSpan<'a>,
{
    fn on_event(&self, _event: &Event<'_>, _ctx: Context<'_, S>) {
        // M0 placeholder：通过 on_event 但不变换。
        // M2-N3 填入字段名匹配 → DENY 列表替换 "[REDACTED]" / HASH 列表改 "len=X sha256=YY"。
    }
}
