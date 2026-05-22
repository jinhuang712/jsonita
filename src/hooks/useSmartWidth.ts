/**
 * 智能宽度 hook ── 内容变化 → 计算 ContentMetrics → 调 window_resize_for_content。
 *
 * Spec ref: spec/06 § 7 智能宽度 4 层逻辑（前端只负责计算 metrics，决策在 Rust）
 * M1-N9：粘长行后自动扩宽；softWrap 开时由后端跳过；userDragged 由后端持久化锁定。
 */

import { useEffect } from 'react';
import { win } from '../ipc/commands';
import { useEditorStore } from '../store/editor';

const SOFT_WRAP_DEFAULT = true; // M2-N1 起从 settings.editorSoftWrap 读

export function useSmartWidth() {
  const content = useEditorStore((s) => s.content);

  useEffect(() => {
    if (content.length === 0) return;
    // debounce 300ms 避免过 IPC 噪音
    const timer = window.setTimeout(() => {
      const lines = content.split('\n');
      const maxLineChars = lines.reduce((m, l) => Math.max(m, l.length), 0);
      const bytes = new Blob([content]).size;
      win
        .resizeForContent({
          maxLineChars,
          lineCount: lines.length,
          bytes,
          softWrapOn: SOFT_WRAP_DEFAULT,
        })
        .catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [content]);
}
