/**
 * 智能缩放 hook ── 内容 / 字号变化 → 计算 ContentMetrics → 调 window_resize_for_content。
 *
 * Spec ref: spec/06 § 7 智能缩放 4 层逻辑（前端只负责计算 metrics，决策在 Rust）
 * M1-N9：内容 / 字号变化后自动缩放；手动尺寸仅作为下次呼出的记忆值。
 */

import { useEffect, useMemo, useRef } from 'react';
import { win } from '../ipc/commands';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore } from '../store/ui';

export function useSmartWidth() {
  const content = useEditorStore((s) => s.content);
  const editorSoftWrap = useSettingsStore((s) => s.settings.editorSoftWrap);
  const editorFontSize = useUiStore((s) => s.editorFontSize);
  const latestContentRef = useRef(content);
  const contentMetrics = useMemo(() => buildContentMetrics(content), [content]);
  latestContentRef.current = content;

  // 仅内容 / 字号变化才缩放；单窗 ↔ 双栏切换不再触发原生窗口尺寸跳变
  // （此前 toggle 后延迟 300ms 跳一次窗口，与布局切换不同步，手感 clunky）。
  useEffect(() => {
    if (content.length === 0) return;
    // debounce 300ms 避免过 IPC 噪音
    const timer = window.setTimeout(() => {
      const latestContent = latestContentRef.current;
      const bytes = new Blob([latestContent]).size;
      win
        .resizeForContent({
          maxLineChars: contentMetrics.maxLineChars,
          lineCount: contentMetrics.lineCount,
          bytes,
          nonWhitespaceChars: contentMetrics.nonWhitespaceChars,
          softWrapOn: editorSoftWrap,
          fontSize: editorFontSize,
        })
        .catch(() => {});
    }, 300);
    return () => window.clearTimeout(timer);
  }, [
    contentMetrics.lineCount,
    contentMetrics.maxLineChars,
    contentMetrics.nonWhitespaceChars,
    editorFontSize,
    editorSoftWrap,
  ]);
}

function buildContentMetrics(content: string) {
  const lines = content.split('\n');
  const maxStructuralLineChars = lines.reduce((max, line) => {
    const structuralWidth = line.replace(/^\s+/, '').length;
    return Math.max(max, structuralWidth);
  }, 0);

  return {
    maxLineChars: maxStructuralLineChars,
    nonWhitespaceChars: content.replace(/\s/g, '').length,
    lineCount: lines.length,
  };
}
