/**
 * Tauri event 名 → payload 类型映射（用于 typed listen）。
 *
 * Spec ref: spec/03_ipc_boundary.md 与 spec/appendix/ipc-api.md。
 */

import type { Settings } from '../store/settings';
import type { WindowResizedPayload } from './commands';

export interface EventMap {
  'tray:toggle': Record<string, never>;
  'tray:open-settings': Record<string, never>;
  'permission:accessibility_missing': Record<string, never>;
  'window:shown': Record<string, never>;
  'window:will-hide': Record<string, never>;
  'window:resized': WindowResizedPayload;
  'shortcut:restore_last': Record<string, never>;
  'settings:changed': Settings;
}
