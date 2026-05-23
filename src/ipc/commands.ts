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
  parse: (text: string) => invoke<string>('json_parse', { text }),
};

// ──────────── history ────────────

import type { OpType } from '../types/enums';

export const history = {
  list: (opts: ListOpts) => invoke<HistoryRow[]>('history_list', { opts }),
  search: (query: string, limit: number) =>
    invoke<HistoryRow[]>('history_search', { query, limit }),
  pin: (id: number, pinned: boolean) => invoke<void>('history_pin', { id, pinned }),
  star: (id: number, starred: boolean) => invoke<void>('history_star', { id, starred }),
  clear: () => invoke<number>('history_clear'),
  add: (content: string, opType: OpType) =>
    invoke<HistoryRow>('history_add', { content, opType }),
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

// ──────────── settings (M2-N1) ────────────

import type { Settings } from '../store/settings';

export const settings = {
  getAll: () => invoke<Settings>('settings_get_all'),
  set: (patch: Partial<Settings>) =>
    invoke<Settings>('settings_set', { patch }),
  reset: () => invoke<Settings>('settings_reset'),
};

// ──────────── ai (M2-N2 keychain; M2-N3 fix/connection real) ────────────

export interface TestConnectionResp {
  ok: boolean;
  latencyMs: number;
  modelEchoed: string;
}

export interface AiFixReq {
  text: string;
  errorLine?: number;
  errorCol?: number;
  errorMsg?: string;
  requestId: string;
}

export interface AiFixResp {
  fixed: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  elapsedMs: number;
}

export const ai = {
  setApiKey: (apiKey: string) => invoke<void>('ai_set_api_key', { apiKey }),
  deleteApiKey: () => invoke<void>('ai_delete_api_key'),
  testConnection: (apiKey: string, modelId: string) =>
    invoke<TestConnectionResp>('ai_test_connection', { apiKey, modelId }),
  hasApiKey: () => invoke<boolean>('ai_has_api_key'),
  fix: (req: AiFixReq) => invoke<AiFixResp>('ai_fix', { req }),
};

// ──────────── shortcuts (M2-N5) ────────────

export type ShortcutAction = 'toggle-window' | 'restore-last';

export type ShortcutRegisterResp =
  | { kind: 'ok' }
  | { kind: 'conflict'; withApp?: string | null }
  | { kind: 'reserved' }
  | { kind: 'invalid-accelerator'; reason: string };

export const shortcuts = {
  register: (action: ShortcutAction, accelerator: string, forceOverride = false) =>
    invoke<ShortcutRegisterResp>('shortcut_register', {
      req: { action, accelerator, forceOverride },
    }),
  status: () => invoke<boolean>('shortcut_status'),
  retry: () => invoke<boolean>('shortcut_retry'),
  openAccessibilitySettings: () => invoke<void>('open_accessibility_settings'),
};
