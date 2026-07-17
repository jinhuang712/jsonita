/**
 * Editor 组件 — CodeMirror 6 React 包装（design/screens.md § 1.4）。
 *
 * - useRef 单次 init（React 18 strict mode double-mount 兼容）
 * - theme 变化时重建 instance（M3-N1 polish 引入 Compartment 实现热切）
 * - 外部 setValue 走 dispatch(changes) 不重建（保留 undo 历史）
 */

import { useEffect, useRef } from 'react';
import { forceLinting, setDiagnostics } from '@codemirror/lint';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { on } from '../ipc/events';
import { makeExtensions, type EditorConfig } from './extensions';

interface EditorProps extends EditorConfig {
  value: string;
  onChange?: (v: string) => void;
  focusOnWindowShown?: boolean;
}

export function Editor({
  value,
  onChange,
  theme,
  focusOnWindowShown = false,
  ...cfg
}: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const errorRef = useRef(cfg.error ?? null);

  errorRef.current = cfg.error ?? null;

  useEffect(() => {
    if (!ref.current) return;
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange?.(update.state.doc.toString());
    });
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          ...makeExtensions({
            theme,
            readOnly: cfg.readOnly,
            softWrap: cfg.softWrap,
            placeholderText: cfg.placeholderText,
            getExternalError: () => errorRef.current,
          }),
          updateListener,
        ],
      }),
      parent: ref.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // theme / config 变化时重建 instance；parse error 变化只刷新 lint，不重建。
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, cfg.readOnly, cfg.softWrap, cfg.placeholderText]);

  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    if (!cfg.error) {
      v.dispatch(setDiagnostics(v.state, []));
    }
    forceLinting(v);
    const id = window.requestAnimationFrame(() => {
      const current = viewRef.current;
      if (!current) return;
      if (!cfg.error) {
        current.dispatch(setDiagnostics(current.state, []));
      }
      forceLinting(current);
    });
    return () => window.cancelAnimationFrame(id);
  }, [cfg.error, value]);

  useEffect(() => {
    if (!focusOnWindowShown) return;
    let disposed = false;
    let frameId: number | null = null;
    let unlisten: (() => void) | undefined;

    on('window:shown', () => {
      frameId = window.requestAnimationFrame(() => {
        if (!disposed) viewRef.current?.focus();
      });
    })
      .then((stop) => {
        if (disposed) {
          stop();
        } else {
          unlisten = stop;
        }
      })
      .catch(() => {});

    return () => {
      disposed = true;
      if (frameId !== null) window.cancelAnimationFrame(frameId);
      unlisten?.();
    };
  }, [focusOnWindowShown]);

  // 外部 setValue（store 调 setContent 用于 AI Fix / 历史恢复）
  useEffect(() => {
    const v = viewRef.current;
    if (!v) return;
    if (v.state.doc.toString() === value) return;
    v.dispatch({
      changes: { from: 0, to: v.state.doc.length, insert: value },
    });
  }, [value]);

  return <div ref={ref} style={{ height: '100%' }} />;
}
