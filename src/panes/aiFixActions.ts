import { history as historyApi } from '../ipc/commands';
import { useEditorStore } from '../store/editor';
import type { Pane } from '../store/ui';

export async function acceptAiFix(
  fixed: string,
  before: string,
  setContent: (content: string) => void,
  resetAi: () => void,
  setActivePane: (pane: Pane) => void,
) {
  // awaiting-decision 期间左侧仍可编辑；若输入已偏离生成 fixed 时的快照，
  // fixed 对应的是旧输入 → 不覆盖用户的新编辑，只退出 AI 态。
  if (useEditorStore.getState().content !== before) {
    resetAi();
    setActivePane('format');
    return;
  }
  setContent(fixed);
  try {
    await historyApi.add(fixed, 'ai-fix');
  } catch (_) {
    /* ignore */
  }
  resetAi();
  setActivePane('format');
}
