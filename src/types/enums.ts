/**
 * 8 个枚举 — Rust 端 `#[serde(rename_all = "kebab-case")]` 跨 IPC 镜像。
 *
 * Spec ref: spec/20-architecture.md 枚举集合。
 */

export type IndentMode = 'spaces2' | 'spaces4' | 'tab';
export type QuoteStyle = 'double' | 'single';
export type OpType = 'format' | 'minify' | 'tree' | 'str-to-json' | 'json-to-str' | 'ai-fix';
export type ThemeMode = 'system' | 'light' | 'dark';
export type RestoreWindow = 'off' | 'min-1' | 'min-5' | 'min-15' | 'hour-1';
export type ShortcutAction = 'toggle-window';
export type InitialWidth = 'w-720' | 'w-860' | 'w-920' | 'w-1080';
