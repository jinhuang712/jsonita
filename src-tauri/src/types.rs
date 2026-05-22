//! 数据模型 ── 8 个 enum + IPC payload structs。
//!
//! Spec ref: `spec/13_schemas.html` § 2 枚举 / § 3 IPC payload structs
//! 所有 enum 用 `kebab-case`；所有 struct 用 `camelCase`（spec/13 § 7 命名规范）。

use serde::{Deserialize, Serialize};

// ──────────── § 2 枚举 ────────────

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum IndentMode {
    Spaces2,
    Spaces4,
    Tab,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum QuoteStyle {
    Double,
    Single,
}

#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum OpType {
    Format,
    Minify,
    Tree,
    StrToJson,
    JsonToStr,
    AiFix,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ThemeMode {
    System,
    Light,
    Dark,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum RestoreWindow {
    Off,
    Min1,
    Min5,
    Min15,
    Hour1,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum ShortcutAction {
    ToggleWindow,
    RestoreLast,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum InitialWidth {
    W720,
    W860,
    W920,
    W1080,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "kebab-case")]
pub enum ShowSource {
    Hotkey,
    Tray,
    Manual,
}

// ──────────── § 3.1 json_ops 选项 ────────────

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormatOpts {
    pub indent: IndentMode,
    #[serde(default)]
    pub sort_keys: bool,
    #[serde(default = "default_trailing_newline")]
    pub trailing_newline: bool,
}

fn default_trailing_newline() -> bool {
    true
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UnwrapOpts {
    #[serde(default = "default_unwrap_timeout")]
    pub timeout_ms: u64,
    #[serde(default)]
    pub max_depth: Option<u32>,
}

fn default_unwrap_timeout() -> u64 {
    200
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StringifyOpts {
    #[serde(default = "default_quote")]
    pub quote: QuoteStyle,
    #[serde(default)]
    pub escape_unicode: bool,
    #[serde(default = "bool_true")]
    pub minify: bool,
}

fn default_quote() -> QuoteStyle {
    QuoteStyle::Double
}
fn bool_true() -> bool {
    true
}

// ──────────── § 3.2 历史 / 会话 ────────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoryRow {
    pub id: i64,
    pub created_at: i64,
    pub content: String,
    pub summary: String,
    pub content_hash: String,
    pub op_type: OpType,
    pub pinned: bool,
    pub starred: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ListOpts {
    #[serde(default = "default_list_limit")]
    pub limit: u32,
    #[serde(default)]
    pub offset: u32,
    #[serde(default)]
    pub only_pinned: Option<bool>,
    #[serde(default)]
    pub only_starred: Option<bool>,
}

fn default_list_limit() -> u32 {
    50
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LastSession {
    pub content: String,
    pub op_type: OpType,
    pub saved_at: i64,
}

// ──────────── § 3.5 窗口 / 系统 ────────────

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowShown {
    pub clipboard: Option<ClipboardSniff>,
    pub last_session: Option<LastSession>,
    pub source: ShowSource,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ClipboardSniff {
    pub text: String,
    pub looks_like_json: bool,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentMetrics {
    pub max_line_chars: u32,
    pub line_count: u32,
    pub bytes: u64,
    pub soft_wrap_on: bool,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WindowResizedPayload {
    pub width: u32,
    pub height: u32,
    pub source: &'static str, // "user" | "auto"
}
