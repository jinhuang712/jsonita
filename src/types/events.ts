/**
 * Tauri event 名 → payload 类型映射（用于 typed listen）。
 *
 * Spec ref: CLAUDE.md 契约段。
 */

import type { Settings } from '../store/settings';

export interface EventMap {
  'tray:open-settings': Record<string, never>;
  'window:shown': Record<string, never>;
  'settings:changed': Settings;
}
