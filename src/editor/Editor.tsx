/**
 * Editor 组件 — CodeMirror 6 React 包装（spec/08 § 1.4）。
 *
 * - useRef 单次 init（React 18 strict mode double-mount 兼容）
 * - theme 变化时重建 instance（M3-N1 polish 引入 Compartment 实现热切）
 * - 外部 setValue 走 dispatch(changes) 不重建（保留 undo 历史）
 */

import { useEffect, useRef } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView } from '@codemirror/view';

import { makeExtensions, type EditorConfig } from './extensions';

interface EditorProps extends EditorConfig {
  value: string;
  onChange?: (v: string) => void;
}

export function Editor({ value, onChange, theme, ...cfg }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) onChange?.(update.state.doc.toString());
    });
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [...makeExtensions({ theme, ...cfg }), updateListener],
      }),
      parent: ref.current,
    });
    viewRef.current = view;
    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // theme / config 变化时重建 instance
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme, cfg.readOnly, cfg.softWrap, cfg.placeholderText, cfg.error]);

  // 外部 setValue（store 调 setContent 用于 AI Fix / 历史恢复 / 上次会话）
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
