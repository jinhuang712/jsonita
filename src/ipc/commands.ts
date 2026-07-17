/**
 * 类型化 IPC invoke 封装 — Rust 端 `#[tauri::command]` snake_case 入口。
 *
 * Spec ref: CLAUDE.md 契约段。
 * 每组一个 namespace 对象（json / history / session / window / system）。
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  ContentMetrics,
  FormatOpts,
  HistoryRow,
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
  star: (id: number, starred: boolean) => invoke<void>('history_star', { id, starred }),
  clear: () => invoke<number>('history_clear'),
  add: (content: string, opType: OpType) =>
    invoke<HistoryRow | null>('history_add', { content, opType }),
};

// ──────────── window ────────────

export const win = {
  show: () => invoke<void>('window_show'),
  hide: () => invoke<void>('window_hide'),
  toggle: () => invoke<void>('window_toggle'),
  resizeForContent: (metrics: ContentMetrics) =>
    invoke<[number, number]>('window_resize_for_content', { metrics }),
  resetSize: () => invoke<void>('window_reset_size'),
  // 传 mode（含 system）；原生读 OS effectiveAppearance 解析后回传 effective light|dark（权威）。
  setTheme: (mode: 'light' | 'dark' | 'system') =>
    invoke<'light' | 'dark'>('window_set_theme', { mode }),
};

// ──────────── system ────────────

export const system = {
  openLogDir: () => invoke<void>('open_log_dir'),
  openDbPath: () => invoke<void>('open_db_path'),
  openGithub: () => invoke<void>('open_github'),
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

// ──────────── ai (secrets.json + DeepSeek HTTP) ────────────

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
  testConnection: (
    apiKey: string,
    protocol: 'openai' | 'anthropic',
    baseUrl: string,
    modelId: string,
  ) =>
    invoke<TestConnectionResp>('ai_test_connection', { apiKey, protocol, baseUrl, modelId }),
  hasApiKey: () => invoke<boolean>('ai_has_api_key'),
  fix: (req: AiFixReq) => invoke<AiFixResp>('ai_fix', { req }),
};

// ──────────── shortcuts (M2-N5) ────────────

export type ShortcutAction = 'toggle-window';

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
