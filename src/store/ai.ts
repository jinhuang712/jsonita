/**
 * AI Fix store slice — 状态机 idle/requesting/awaiting-decision/error。
 *
 * Spec ref: spec/11_ai_client.md § 8.1 前端状态机
 */

import { create } from 'zustand';

export type AiStatus = 'idle' | 'requesting' | 'awaiting-decision' | 'error';

interface AiState {
  status: AiStatus;
  before: string;
  after: string;
  error: string | null;

  startFix: (before: string) => void;
  setSuccess: (after: string) => void;
  setError: (err: string) => void;
  retry: () => void;
  reset: () => void;
}

export const useAiStore = create<AiState>((set) => ({
  status: 'idle',
  before: '',
  after: '',
  error: null,

  startFix: (before) => set({ status: 'requesting', before, after: '', error: null }),
  setSuccess: (after) => set({ status: 'awaiting-decision', after, error: null }),
  setError: (err) => set({ status: 'error', error: err }),
  retry: () => set({ status: 'idle', after: '', error: null }),
  reset: () => set({ status: 'idle', before: '', after: '', error: null }),
}));
