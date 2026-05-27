import { history as historyApi } from '../ipc/commands';
import type { Pane } from '../store/ui';

export async function acceptAiFix(
  fixed: string,
  setContent: (content: string) => void,
  resetAi: () => void,
  setActivePane: (pane: Pane) => void,
) {
  setContent(fixed);
  try {
    await historyApi.add(fixed, 'ai-fix');
  } catch (_) {
    /* ignore */
  }
  resetAi();
  setActivePane('format');
}
