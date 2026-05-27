/**
 * Tauri event 名 → payload 类型映射（用于 typed listen）。
 *
 * Spec ref: spec/02_ipc.html § 7 Events 总表
 */

import type { Settings } from '../store/settings';
import type { WindowResizedPayload } from './commands';

export interface EventMap {
  'tray:toggle': Record<string, never>;
  'tray:open-settings': Record<string, never>;
  'permission:accessibility_missing': Record<string, never>;
  'window:resized': WindowResizedPayload;
  'shortcut:restore_last': Record<string, never>;
  'settings:changed': Settings;
}
