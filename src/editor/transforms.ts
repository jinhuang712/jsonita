/**
 * Pane -> JSON operation mapping shared by live preview and single-pane apply.
 */

import { json } from '../ipc/commands';
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

/**
 * 单窗模式 ⌘Enter 应用当前功能的结果回输入编辑器。
 * ai-fix pane 的 Cmd+Enter 由 useGlobalHotkeys 的统一分发器单独处理（accept AI fix），
 * 调用方已排除 ai-fix，因此这里与 preview 等价。
 */
export async function runPaneApply(text: string, pane: Pane): Promise<string> {
  return runPanePreview(text, pane);
}
