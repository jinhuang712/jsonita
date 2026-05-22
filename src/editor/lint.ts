/**
 * 外部 linter — 从 store 读 Rust 端返回的 EditorError，转 CodeMirror Diagnostic。
 *
 * Spec ref: spec/08 § 2.2 合并策略
 * - jsonParseLinter() 在 extensions 里实时 squiggle（CM 自带）
 * - external linter 收到 store.error 后绘 更精确的 line/col 标注
 *
 * M1-N3：实现轮廓；M1-N4 store/editor 加 error 字段后通过 getError 注入。
 */

import { linter, type Diagnostic } from '@codemirror/lint';

export interface ExternalEditorError {
  line: number;
  col: number;
  msg: string;
}

export function externalErrorAsDiagnostic(
  doc: string,
  err: ExternalEditorError | null,
): Diagnostic[] {
  if (!err) return [];
  const lines = doc.split(/\r?\n/);
  let from = 0;
  for (let i = 0; i < err.line - 1 && i < lines.length; i++) {
    from += lines[i].length + 1;
  }
  from += Math.max(0, err.col - 1);
  const to = Math.min(doc.length, from + 1);
  return [{ from, to, severity: 'error', message: err.msg, source: 'jsonita-engine' }];
}

export function externalLinter(getError: () => ExternalEditorError | null) {
  return linter(
    (view) => externalErrorAsDiagnostic(view.state.doc.toString(), getError()),
    { delay: 0 },
  );
}
