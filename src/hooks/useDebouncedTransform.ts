/**
 * Editor onChange → debounce 300 ms → Rust engine 调用 → 更新 store output / error。
 *
 * Spec ref: spec/02_frontend_execution.md / design/08_editor.md 状态栏联动。
 * 大文件 > 5 MB 直接标 `large` 不调 engine（design/08 § 3.1）。
 */

import { useEffect, useRef } from 'react';
import { runPanePreview, paneToOpType } from '../editor/transforms';
import { isJsonitaError } from '../ipc/error';
import { session } from '../ipc/commands';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore } from '../store/ui';

const LARGE_THRESHOLD = 5 * 1024 * 1024;

export function useDebouncedTransform() {
  const requestSeqRef = useRef(0);
  const content = useEditorStore((s) => s.content);
  const setOutput = useEditorStore((s) => s.setOutput);
  const setStatus = useEditorStore((s) => s.setStatus);
  const setError = useEditorStore((s) => s.setError);
  const activePane = useUiStore((s) => s.activePane);
  const setShowAiFix = useUiStore((s) => s.setShowAiFix);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);

  useEffect(() => {
    const requestSeq = ++requestSeqRef.current;
    const isCurrentRequest = () => requestSeq === requestSeqRef.current;

    if (content.trim() === '') {
      setStatus('empty');
      setOutput('');
      setError(null);
      setShowAiFix(false);
      return;
    }
    if (content.length > LARGE_THRESHOLD) {
      setStatus('large');
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const previewPane = singlePaneMode ? 'format' : activePane;
        const result = await runPanePreview(content, previewPane);
        if (!isCurrentRequest()) return;
        setOutput(result);
        setStatus('valid');
        setError(null);
        setShowAiFix(false);
        // M1-N7：success 时持久化 last_session（恢复支持）
        session
          .saveLast({
            content,
            opType: paneToOpType(activePane),
            savedAt: Date.now(),
          })
          .catch(() => {});
      } catch (e: unknown) {
        if (!isCurrentRequest()) return;
        if (isJsonitaError(e) && e.kind === 'Parse') {
          setStatus('error');
          setError({ line: e.data.line, col: e.data.col, msg: e.data.msg });
          setShowAiFix(true);
        } else {
          // Io / 其他 ── 退回 empty 不闪屏；未来可接统一错误 UI。
          setStatus('empty');
        }
      }
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [content, activePane, setOutput, setStatus, setError, setShowAiFix, singlePaneMode]);
}
