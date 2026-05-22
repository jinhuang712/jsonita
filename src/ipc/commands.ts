/**
 * 类型化 IPC invoke 封装 — Rust 端 `#[tauri::command]` snake_case 入口。
 *
 * Spec ref: spec/02_ipc.html § 6.1 命令签名。
 * 每组一个 namespace 对象（json / history / session / window / system）。
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  ClipboardSniff,
  ContentMetrics,
  FormatOpts,
  HistoryRow,
  LastSession,
  ListOpts,
  StringifyOpts,
  UnwrapOpts,
} from '../types/commands';

// ──────────── json_ops ────────────

export const json = {
  format: (text: string, opts: FormatOpts) =>
    invoke<string>('json_format', { text, opts }),
  minify: (text: string) => invoke<string>('json_minify', { text }),
  unwrapStringified: (text: string, opts: UnwrapOpts) =>
    invoke<string>('json_unwrap_stringified', { text, opts }),
  stringify: (text: string, opts: StringifyOpts) =>
    invoke<string>('json_stringify', { text, opts }),
};

// ──────────── history ────────────

export const history = {
  list: (opts: ListOpts) => invoke<HistoryRow[]>('history_list', { opts }),
  search: (query: string, limit: number) =>
    invoke<HistoryRow[]>('history_search', { query, limit }),
  pin: (id: number, pinned: boolean) => invoke<void>('history_pin', { id, pinned }),
  star: (id: number, starred: boolean) => invoke<void>('history_star', { id, starred }),
  clear: () => invoke<number>('history_clear'),
};

// ──────────── session ────────────

export const session = {
  saveLast: (s: LastSession) => invoke<void>('session_save_last', { s }),
  loadLast: () => invoke<LastSession | null>('session_load_last'),
  clearLast: () => invoke<void>('session_clear_last'),
};

// ──────────── window ────────────

export const win = {
  show: () => invoke<void>('window_show'),
  hide: () => invoke<void>('window_hide'),
  toggle: () => invoke<void>('window_toggle'),
  resizeForContent: (metrics: ContentMetrics) =>
    invoke<[number, number]>('window_resize_for_content', { metrics }),
  resetSize: () => invoke<void>('window_reset_size'),
};

// ──────────── system ────────────

export const system = {
  clipboardRead: () => invoke<ClipboardSniff>('clipboard_read'),
  openLogDir: () => invoke<void>('open_log_dir'),
  openDbPath: () => invoke<void>('open_db_path'),
  quitApp: () => invoke<void>('quit_app'),
};
