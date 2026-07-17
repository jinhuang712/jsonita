//! 数据模型 ── 枚举 + IPC payload structs。
//!
//! Spec ref: `CLAUDE.md 契约段` 枚举与 IPC payload structs。
//! 所有 enum 用 `kebab-case`；所有 struct 用 `camelCase`。

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
pub enum Locale {
    #[serde(rename = "en-US")]
    EnUs,
    #[serde(rename = "zh-CN")]
    ZhCn,
}

fn default_shortcut_split_toggle() -> String {
    "CmdOrCtrl+\\".to_string()
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
    pub only_starred: Option<bool>,
}

fn default_list_limit() -> u32 {
    50
}

// ──────────── § 3.5 窗口 / 系统 ────────────

/// ContentMetrics ── 前端计算后传过来；后端 4 层缩放逻辑消费结构宽度、行数、字号等。
#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ContentMetrics {
    pub max_line_chars: u32,
    pub line_count: u32,
    /// TS mirror 保留：前端仍上报，但后端缩放逻辑当前不消费。
    #[allow(dead_code)]
    pub bytes: u64,
    pub non_whitespace_chars: u32,
    pub soft_wrap_on: bool,
    pub font_size: f64,
}

// ──────────── § 3.3 设置（M2-N1 真实化前 default） ────────────

/// AI 服务协议 ── openai = OpenAI 兼容 chat/completions（含 DeepSeek 等）；
/// anthropic = Anthropic Messages。决定请求体 / 鉴权头 / 响应解析。
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AiProtocol {
    OpenAi,
    Anthropic,
}

fn default_ai_protocol() -> AiProtocol {
    AiProtocol::OpenAi
}

fn default_ai_max_tokens() -> u32 {
    8192
}

/// Settings 全字段权威定义见 CLAUDE.md 契约段。
/// M1-N8 仅以 default 形态注入 SettingsStore；M2-N1 起从 settings.json 加载 + patch + 落盘。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub launch_at_login: bool,
    pub hide_on_blur: bool,
    pub single_pane_mode: bool,
    pub theme: ThemeMode,
    pub locale: Locale,
    pub smart_width: bool,
    pub shortcut_toggle: String,
    #[serde(default = "default_shortcut_split_toggle")]
    pub shortcut_split_toggle: String,
    pub ai_enabled: bool,
    #[serde(default = "default_ai_protocol")]
    pub ai_protocol: AiProtocol,
    #[serde(default)]
    pub ai_base_url: String,
    pub ai_model_id: String,
    #[serde(default)]
    pub ai_thinking: bool,
    #[serde(default = "default_ai_max_tokens")]
    pub ai_max_tokens: u32,
    pub history_limit: u32,
    #[serde(default = "default_history_enabled")]
    pub history_enabled: bool,
    pub auto_unwrap: bool,
    #[serde(default)]
    pub always_string_to_json: bool,
    pub unwrap_timeout_ms: u64,
    pub editor_soft_wrap: bool,
}

fn default_history_enabled() -> bool {
    true
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            launch_at_login: true,
            hide_on_blur: true,
            single_pane_mode: false,
            theme: ThemeMode::System,
            locale: Locale::EnUs,
            smart_width: true,
            shortcut_toggle: "CmdOrCtrl+Shift+J".to_string(),
            shortcut_split_toggle: "CmdOrCtrl+\\".to_string(),
            ai_enabled: false,
            ai_protocol: AiProtocol::OpenAi,
            ai_base_url: String::new(),
            ai_model_id: String::new(),
            ai_thinking: false,
            ai_max_tokens: 8192,
            history_limit: 100,
            history_enabled: true,
            auto_unwrap: true,
            always_string_to_json: false,
            unwrap_timeout_ms: 200,
            editor_soft_wrap: true,
        }
    }
}
