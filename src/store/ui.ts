/**
 * UI store slice — 浮窗活跃 tab / Modal 状态 / AI Fix Tab 可见性。
 *
 * Spec ref: spec/00 § 9 store/ui
 */

import { create } from 'zustand';

export type Pane = 'format' | 'minify' | 'tree' | 'json-to-str' | 'str-to-json' | 'ai-fix';
export type SinglePaneApplyState = 'idle' | 'running' | 'success' | 'error';

export const DEFAULT_EDITOR_FONT_SIZE = 13;
export const MIN_EDITOR_FONT_SIZE = 10;
export const MAX_EDITOR_FONT_SIZE = 24;
export const EDITOR_FONT_ZOOM_STEP = 2;

interface UiState {
  activePane: Pane;
  showAiFix: boolean; // editor parse error 时 = true
  historyModalOpen: boolean;
  settingsModalOpen: boolean;
  singlePaneApplyState: SinglePaneApplyState;
  editorFontSize: number;

  setActivePane: (p: Pane) => void;
  setShowAiFix: (b: boolean) => void;
  setHistoryModalOpen: (b: boolean) => void;
  setSettingsModalOpen: (b: boolean) => void;
  setSinglePaneApplyState: (s: SinglePaneApplyState) => void;
  setEditorFontSize: (size: number) => void;
  zoomEditorFont: (delta: number) => void;
  resetEditorFontSize: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  activePane: 'format',
  showAiFix: false,
  historyModalOpen: false,
  settingsModalOpen: false,
  singlePaneApplyState: 'idle',
  editorFontSize: DEFAULT_EDITOR_FONT_SIZE,

  setActivePane: (p) => set({ activePane: p }),
  setShowAiFix: (b) => set({ showAiFix: b }),
  setHistoryModalOpen: (b) => set({ historyModalOpen: b }),
  setSettingsModalOpen: (b) => set({ settingsModalOpen: b }),
  setSinglePaneApplyState: (s) => set({ singlePaneApplyState: s }),
  setEditorFontSize: (size) =>
    set({ editorFontSize: clampFontSize(size) }),
  zoomEditorFont: (delta) =>
    set((s) => ({ editorFontSize: clampFontSize(s.editorFontSize + delta) })),
  resetEditorFontSize: () => set({ editorFontSize: DEFAULT_EDITOR_FONT_SIZE }),
}));

function clampFontSize(size: number): number {
  return Math.max(MIN_EDITOR_FONT_SIZE, Math.min(MAX_EDITOR_FONT_SIZE, size));
}
