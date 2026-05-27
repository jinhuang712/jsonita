/**
 * 智能缩放 hook ── 内容 / 字号变化 → 计算 ContentMetrics → 调 window_resize_for_content。
 *
 * Spec ref: spec/06 § 7 智能缩放 4 层逻辑（前端只负责计算 metrics，决策在 Rust）
 * M1-N9：内容 / 字号变化后自动缩放；userDragged 由后端持久化锁定。
 */

import { useEffect } from 'react';
import { win } from '../ipc/commands';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore } from '../store/ui';

export function useSmartWidth() {
  const content = useEditorStore((s) => s.content);
  const editorSoftWrap = useSettingsStore((s) => s.settings.editorSoftWrap);
  const editorFontSize = useUiStore((s) => s.editorFontSize);

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
          softWrapOn: editorSoftWrap,
          fontSize: editorFontSize,
        })
        .catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [content, editorFontSize, editorSoftWrap]);
}
