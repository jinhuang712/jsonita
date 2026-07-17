/**
 * Tauri event 名 → payload 类型映射（用于 typed listen）。
 *
 * Spec ref: spec/S02-ipc-boundary.md 与 spec/platform/I01-ipc-api.md。
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
  'settings:changed': Settings;
}
