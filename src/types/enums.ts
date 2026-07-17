/**
 * IPC 枚举 — Rust 端 `#[serde(rename_all = "kebab-case")]` 跨 IPC 镜像。
 */

export type IndentMode = 'spaces2' | 'spaces4' | 'tab';
export type QuoteStyle = 'double' | 'single';
export type OpType = 'format' | 'minify' | 'tree' | 'str-to-json' | 'json-to-str' | 'ai-fix';
export type ThemeMode = 'system' | 'light' | 'dark';
export type ShortcutAction = 'toggle-window';
