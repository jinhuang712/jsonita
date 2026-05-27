/**
 * UI store slice — 浮窗活跃 tab / Modal 状态 / AI Fix Tab 可见性。
 *
 * Spec ref: spec/00 § 9 store/ui
 */

import { create } from 'zustand';

export type Pane = 'format' | 'minify' | 'tree' | 'json-to-str' | 'str-to-json' | 'ai-fix';
export type SinglePaneApplyState = 'idle' | 'running' | 'success' | 'error';

interface UiState {
  activePane: Pane;
  showAiFix: boolean; // editor parse error 时 = true
  historyModalOpen: boolean;
  settingsModalOpen: boolean;
  singlePaneApplyState: SinglePaneApplyState;

  setActivePane: (p: Pane) => void;
  setShowAiFix: (b: boolean) => void;
  setHistoryModalOpen: (b: boolean) => void;
  setSettingsModalOpen: (b: boolean) => void;
  setSinglePaneApplyState: (s: SinglePaneApplyState) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activePane: 'format',
  showAiFix: false,
  historyModalOpen: false,
  settingsModalOpen: false,
  singlePaneApplyState: 'idle',

  setActivePane: (p) => set({ activePane: p }),
  setShowAiFix: (b) => set({ showAiFix: b }),
  setHistoryModalOpen: (b) => set({ historyModalOpen: b }),
  setSettingsModalOpen: (b) => set({ settingsModalOpen: b }),
  setSinglePaneApplyState: (s) => set({ singlePaneApplyState: s }),
}));
