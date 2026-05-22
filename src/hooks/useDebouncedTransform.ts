/**
 * Editor onChange → debounce 300 ms → Rust engine 调用 → 更新 store output / error。
 *
 * Spec ref: spec/00 § 6 数据流 / spec/08 § 3 状态栏联动。
 * 大文件 > 5 MB 直接标 `large` 不调 engine（spec/08 § 3.1）。
 */

import { useEffect } from 'react';
import { isJsonitaError } from '../ipc/error';
import { json } from '../ipc/commands';
import { useEditorStore } from '../store/editor';
import { useUiStore, type Pane } from '../store/ui';

const LARGE_THRESHOLD = 5 * 1024 * 1024;

async function runOp(text: string, op: Pane): Promise<string> {
  switch (op) {
    case 'minify':
      return json.minify(text);
    case 'json-to-str':
      return json.stringify(text, { quote: 'double', escapeUnicode: false, minify: true });
    case 'str-to-json':
      return json.parse(text);
    case 'format':
    case 'tree':
    case 'ai-fix':
    default:
      return json.format(text, {
        indent: 'spaces2',
        sortKeys: false,
        trailingNewline: true,
      });
  }
}

export function useDebouncedTransform() {
  const content = useEditorStore((s) => s.content);
  const setOutput = useEditorStore((s) => s.setOutput);
  const setStatus = useEditorStore((s) => s.setStatus);
  const setError = useEditorStore((s) => s.setError);
  const activePane = useUiStore((s) => s.activePane);
  const setShowAiFix = useUiStore((s) => s.setShowAiFix);

  useEffect(() => {
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
        const result = await runOp(content, activePane);
        setOutput(result);
        setStatus('valid');
        setError(null);
        setShowAiFix(false);
      } catch (e: unknown) {
        if (isJsonitaError(e) && e.kind === 'Parse') {
          setStatus('error');
          setError({ line: e.data.line, col: e.data.col, msg: e.data.msg });
          setShowAiFix(true);
        } else {
          // Io / 其他 ── 退回 empty 不闪屏（M3-N1 polish 时加 Toast）
          setStatus('empty');
        }
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [content, activePane, setOutput, setStatus, setError, setShowAiFix]);
}
