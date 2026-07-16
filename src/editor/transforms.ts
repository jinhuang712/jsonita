/**
 * Pane -> JSON operation mapping shared by live preview and single-pane apply.
 */

import { ai, json } from '../ipc/commands';
import type { EditorError } from '../store/editor';
import type { Pane } from '../store/ui';
import type { OpType } from '../types/enums';

export function paneToOpType(p: Pane): OpType {
  switch (p) {
    case 'minify':
      return 'minify';
    case 'tree':
      return 'tree';
    case 'json-to-str':
      return 'json-to-str';
    case 'ai-fix':
      return 'ai-fix';
    case 'format':
    default:
      return 'format';
  }
}

export async function runPanePreview(text: string, pane: Pane): Promise<string> {
  switch (pane) {
    case 'minify':
      return json.minify(text);
    case 'json-to-str':
      return json.stringify(text, { quote: 'double', escapeUnicode: false, minify: true });
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

export async function runPaneApply(
  text: string,
  pane: Pane,
  error: EditorError | null,
): Promise<string> {
  if (pane !== 'ai-fix') {
    return runPanePreview(text, pane);
  }

  const resp = await ai.fix({
    text,
    errorLine: error?.line,
    errorCol: error?.col,
    errorMsg: error?.msg,
    requestId: crypto.randomUUID(),
  });
  return resp.fixed;
}
