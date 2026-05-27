/**
 * JSON lint helpers — 把 Rust 端 EditorError 和前端辅助检查转 CodeMirror Diagnostic。
 *
 * Spec ref: spec/08 § 2.2 合并策略
 * - jsonParseLinter() 在 extensions 里实时 squiggle（CM 自带）
 * - supplemental linter 标出 parser 停下后仍肉眼可见的常见非法 JSON token
 * - external linter 收到 store.error 后绘更精确的 line/col 标注
 *
 * M1-N3：实现轮廓；M1-N4 store/editor 加 error 字段后通过 getError 注入。
 */

import { linter, type Diagnostic } from '@codemirror/lint';

export interface ExternalEditorError {
  line: number;
  col: number;
  msg: string;
}

const SUPPLEMENTAL_SOURCE = 'jsonita-json-hints';

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
  const lineText = lines[Math.max(0, err.line - 1)] ?? '';
  const colIndex = Math.max(0, err.col - 1);
  const tokenMatch = lineText.slice(colIndex).match(/^[^\s,}\]]+/);
  const tokenLength = tokenMatch?.[0]?.length ?? 1;
  const to = Math.min(doc.length, from + Math.max(1, tokenLength));
  return [{ from, to, severity: 'error', message: err.msg, source: 'jsonita-engine' }];
}

export function externalLinter(getError: () => ExternalEditorError | null) {
  return linter(
    (view) => externalErrorAsDiagnostic(view.state.doc.toString(), getError()),
    { delay: 0 },
  );
}

export function supplementalJsonDiagnostics(doc: string): Diagnostic[] {
  if (doc.trim() === '') return [];

  const diagnostics: Diagnostic[] = [];
  let lineStart = 0;

  for (const line of doc.split('\n')) {
    const text = line.endsWith('\r') ? line.slice(0, -1) : line;
    const mask = collectLineStringAndCommentIssues(text, lineStart, diagnostics);
    collectUnquotedKeyIssues(mask, lineStart, diagnostics);
    collectInvalidLiteralIssues(mask, lineStart, diagnostics);
    lineStart += line.length + 1;
  }

  return dedupeDiagnostics(diagnostics);
}

export function supplementalJsonLinter() {
  return linter(
    (view) => supplementalJsonDiagnostics(view.state.doc.toString()),
    { delay: 150 },
  );
}

function collectLineStringAndCommentIssues(
  line: string,
  lineStart: number,
  diagnostics: Diagnostic[],
): string {
  const mask = line.split('');
  let quote: '"' | "'" | null = null;
  let quoteStart = -1;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const next = line[i + 1];

    if (quote) {
      mask[i] = ' ';

      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === '\\') {
        escaped = true;
        continue;
      }

      if (ch === quote) {
        if (quote === "'") {
          pushDiagnostic(
            diagnostics,
            lineStart + quoteStart,
            lineStart + i + 1,
            'JSON strings must use double quotes',
          );
        }
        quote = null;
        quoteStart = -1;
      }

      continue;
    }

    if (ch === '/' && next === '/') {
      pushDiagnostic(
        diagnostics,
        lineStart + i,
        lineStart + line.length,
        'JSON does not allow comments',
      );
      for (let j = i; j < mask.length; j++) mask[j] = ' ';
      break;
    }

    if (ch === '"' || ch === "'") {
      quote = ch;
      quoteStart = i;
      mask[i] = ' ';
    }
  }

  if (quote === "'") {
    pushDiagnostic(
      diagnostics,
      lineStart + quoteStart,
      lineStart + line.length,
      'JSON strings must use double quotes',
    );
  }

  return mask.join('');
}

function collectUnquotedKeyIssues(mask: string, lineStart: number, diagnostics: Diagnostic[]) {
  const keyPattern = /(^|[,{])\s*([A-Za-z_$][\w$-]*)\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = keyPattern.exec(mask))) {
    const key = match[2];
    const keyStartInMatch = match[0].lastIndexOf(key);
    const from = lineStart + match.index + keyStartInMatch;
    pushDiagnostic(
      diagnostics,
      from,
      from + key.length,
      'JSON object keys must use double quotes',
    );
  }
}

function collectInvalidLiteralIssues(mask: string, lineStart: number, diagnostics: Diagnostic[]) {
  const literalPattern = /\b(True|False|None|Null|undefined)\b/g;
  let match: RegExpExecArray | null;

  while ((match = literalPattern.exec(mask))) {
    const token = match[1];
    const replacement = invalidLiteralReplacement(token);
    pushDiagnostic(
      diagnostics,
      lineStart + match.index,
      lineStart + match.index + token.length,
      replacement ? `Use ${replacement} in JSON` : 'JSON does not support undefined',
    );
  }
}

function invalidLiteralReplacement(token: string): string | null {
  if (token === 'True') return 'true';
  if (token === 'False') return 'false';
  if (token === 'None' || token === 'Null') return 'null';
  return null;
}

function pushDiagnostic(
  diagnostics: Diagnostic[],
  from: number,
  to: number,
  message: string,
) {
  if (to <= from) return;
  diagnostics.push({ from, to, severity: 'error', message, source: SUPPLEMENTAL_SOURCE });
}

function dedupeDiagnostics(diagnostics: Diagnostic[]): Diagnostic[] {
  const seen = new Set<string>();

  return diagnostics.filter((diagnostic) => {
    const key = `${diagnostic.from}:${diagnostic.to}:${diagnostic.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
