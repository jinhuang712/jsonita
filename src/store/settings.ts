/**
 * Settings zustand slice — mirror Rust Settings struct（spec/13 § 3.3）。
 *
 * 启动期 settings_get_all 一次性加载；patch 通过 settings_set IPC + 监听 settings:changed event 自动同步。
 */

import { create } from 'zustand';
import type {
  InitialWidth,
  RestoreWindow,
  ThemeMode,
} from '../types/enums';

export interface Settings {
  launchAtLogin: boolean;
  showInMenubar: boolean;
  autoPasteClipboard: boolean;
  hideOnBlur: boolean;
  singlePaneMode: boolean;
  theme: ThemeMode;
  locale: 'en-US' | 'zh-CN';
  restoreWindow: RestoreWindow;
  initialWidth: InitialWidth;
  smartWidth: boolean;
  shortcutToggle: string;
  shortcutRestoreLast: string;
  aiEnabled: boolean;
  aiModelId: string;
  historyLimit: number;
  autoUnwrap: boolean;
  unwrapTimeoutMs: number;
  editorSoftWrap: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  launchAtLogin: true,
  showInMenubar: true,
  autoPasteClipboard: true,
  hideOnBlur: true,
  singlePaneMode: false,
  theme: 'system',
  locale: 'en-US',
  restoreWindow: 'min-5',
  initialWidth: 'w-920',
  smartWidth: true,
  shortcutToggle: 'CmdOrCtrl+Shift+J',
  shortcutRestoreLast: 'CmdOrCtrl+Shift+L',
  aiEnabled: false,
  aiModelId: 'deepseek-chat',
  historyLimit: 100,
  autoUnwrap: true,
  unwrapTimeoutMs: 200,
  editorSoftWrap: true,
};

interface SettingsState {
  settings: Settings;
  setSettings: (s: Settings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  setSettings: (s) => set({ settings: s }),
}));
