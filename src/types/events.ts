/**
 * Tauri event 名 → payload 类型映射（用于 typed listen）。
 *
 * Spec ref: spec/02_ipc.html § 7 Events 总表
 */

import type { WindowResizedPayload, WindowShown } from './commands';

export interface EventMap {
  'window:shown': WindowShown;
  'window:hidden': Record<string, never>;
  'window:resized': WindowResizedPayload;
  'shortcut:restore_last': Record<string, never>;
  'history:updated': Record<string, never>;
  'theme:system_changed': { mode: 'light' | 'dark' };
  'app:will_quit': Record<string, never>;

  // M0-N4 既有
  'permission:accessibility_missing': string;
  // M0-N2 既有
  'tray:toggle': Record<string, never>;
}
