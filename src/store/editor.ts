/**
 * Editor store slice — 编辑器输入 / 输出 / 错误位置 / 解析状态。
 *
 * Spec ref: spec/00_architecture.md § 9 + design/08_editor.md § 3
 * M1-N1: 仅 input/output 基础字段；M1-N3 CodeMirror 接入后 onChange 触发 debounce + IPC。
 */

import { create } from 'zustand';

export type EditorStatus = 'valid' | 'error' | 'empty' | 'large';

export interface EditorError {
  line: number;
  col: number;
  msg: string;
}

interface EditorState {
  content: string;
  outputText: string;
  status: EditorStatus;
  error: EditorError | null;
  bytes: number;
  lines: number;

  setContent: (s: string) => void;
  setOutput: (s: string) => void;
  setError: (e: EditorError | null) => void;
  setStatus: (s: EditorStatus) => void;
  clear: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  content: '',
  outputText: '',
  status: 'empty',
  error: null,
  bytes: 0,
  lines: 0,

  setContent: (s) => set({ content: s, bytes: new Blob([s]).size, lines: s.split('\n').length }),
  setOutput: (s) => set({ outputText: s }),
  setError: (e) => set({ error: e }),
  setStatus: (s) => set({ status: s }),
  clear: () =>
    set({
      content: '',
      outputText: '',
      status: 'empty',
      error: null,
      bytes: 0,
      lines: 0,
    }),
}));
