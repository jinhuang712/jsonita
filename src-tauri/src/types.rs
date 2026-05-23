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
pub enum Locale {
    #[serde(rename = "en-US")]
    EnUs,
    #[serde(rename = "zh-CN")]
    ZhCn,
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

/// spec/13 § 2 conformance；M2-N5 接快捷键用 String 而非 enum，留作 future。
#[allow(dead_code)]
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

/// spec/13 § 2 conformance；window:shown event payload 留 M3 polish 时 emit。
#[allow(dead_code)]
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

/// spec/13 § 3.5 window:shown event payload；M3 polish 时 emit 接 WindowEvent。
#[allow(dead_code)]
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

/// spec/13 § 3.5 ContentMetrics ── line_count + bytes 字段为 TS mirror 保留
/// （前端计算后传过来；后端 4 层逻辑仅消费 max_line_chars + soft_wrap_on）。
#[allow(dead_code)]
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

// ──────────── § 3.3 设置（M2-N1 真实化前 default） ────────────

/// Settings 全字段权威定义 ── spec/13 § 3.3。
/// M1-N8 仅以 default 形态注入 SettingsStore；M2-N1 起从 settings.json 加载 + patch + 落盘。
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Settings {
    pub launch_at_login: bool,
    pub show_in_menubar: bool,
    pub auto_paste_clipboard: bool,
    pub hide_on_blur: bool,
    pub single_pane_mode: bool,
    pub theme: ThemeMode,
    pub locale: Locale,
    pub restore_window: RestoreWindow,
    pub initial_width: InitialWidth,
    pub smart_width: bool,
    pub shortcut_toggle: String,
    pub shortcut_restore_last: String,
    pub ai_enabled: bool,
    pub ai_model_id: String,
    pub history_limit: u32,
    pub auto_unwrap: bool,
    pub unwrap_timeout_ms: u64,
    pub editor_soft_wrap: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Settings {
            launch_at_login: true,
            show_in_menubar: true,
            auto_paste_clipboard: true,
            hide_on_blur: true,
            single_pane_mode: false,
            theme: ThemeMode::System,
            locale: Locale::EnUs,
            restore_window: RestoreWindow::Min5,
            initial_width: InitialWidth::W920,
            smart_width: true,
            shortcut_toggle: "CmdOrCtrl+Shift+J".to_string(),
            shortcut_restore_last: "CmdOrCtrl+Shift+L".to_string(),
            ai_enabled: false,
            ai_model_id: "deepseek-chat".to_string(),
            history_limit: 100,
            auto_unwrap: true,
            unwrap_timeout_ms: 200,
            editor_soft_wrap: true,
        }
    }
}
