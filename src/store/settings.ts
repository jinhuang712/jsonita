/**
 * Settings zustand slice — mirror Rust Settings struct（spec/20-architecture.md）。
 *
 * 启动期 settings_get_all 一次性加载；patch 通过 settings_set IPC + 监听 settings:changed event 自动同步。
 */

import { create } from 'zustand';
import type {
  InitialWidth,
  ThemeMode,
} from '../types/enums';

export interface Settings {
  launchAtLogin: boolean;
  showInMenubar: boolean;
  hideOnBlur: boolean;
  singlePaneMode: boolean;
  theme: ThemeMode;
  locale: 'en-US' | 'zh-CN';
  initialWidth: InitialWidth;
  smartWidth: boolean;
  shortcutToggle: string;
  shortcutSplitToggle: string;
  aiEnabled: boolean;
  aiProtocol: 'openai' | 'anthropic';
  aiBaseUrl: string;
  aiModelId: string;
  aiThinking: boolean;
  aiMaxTokens: number;
  historyLimit: number;
  historyEnabled: boolean;
  autoUnwrap: boolean;
  alwaysStringToJson: boolean;
  unwrapTimeoutMs: number;
  editorSoftWrap: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  launchAtLogin: true,
  showInMenubar: true,
  hideOnBlur: true,
  singlePaneMode: false,
  theme: 'system',
  locale: 'en-US',
  initialWidth: 'w-920',
  smartWidth: true,
  shortcutToggle: 'CmdOrCtrl+Shift+J',
  shortcutSplitToggle: 'CmdOrCtrl+\\',
  aiEnabled: false,
  aiProtocol: 'openai',
  aiBaseUrl: '',
  aiModelId: '',
  aiThinking: false,
  aiMaxTokens: 8192,
  historyLimit: 100,
  historyEnabled: true,
  autoUnwrap: true,
  alwaysStringToJson: false,
  unwrapTimeoutMs: 200,
  editorSoftWrap: true,
};

interface SettingsState {
  settings: Settings;
  /** 是否已从后端加载过真实 settings（区别于启动期的 DEFAULT_SETTINGS 占位）。 */
  loaded: boolean;
  setSettings: (s: Settings) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,
  setSettings: (s) => set({ settings: s, loaded: true }),
}));
