/**
 * 浮窗内 hotkeys ── ⌘K 清空 / ⌘⇧L 恢复上次会话 / Esc 关 / ⌘W 关。
 *
 * Spec ref: spec/07 § 4 In-app 快捷键。
 */

import { useHotkeys } from 'react-hotkeys-hook';
import { session, win } from '../ipc/commands';
import { useEditorStore } from '../store/editor';

export function useGlobalHotkeys() {
  const setContent = useEditorStore((s) => s.setContent);
  const clearEditor = useEditorStore((s) => s.clear);

  // ⌘K 清空 + 不污染 last_session（M1-N7：调 session_clear_last 显式清）
  useHotkeys(
    'meta+k',
    () => {
      clearEditor();
      session.clearLast().catch(() => {});
    },
    { preventDefault: true },
  );

  // ⌘⇧L 找回上次会话
  useHotkeys(
    'meta+shift+l',
    async () => {
      try {
        const last = await session.loadLast();
        if (last && last.content) {
          setContent(last.content);
        }
      } catch (_) {
        /* ignore */
      }
    },
    { preventDefault: true },
  );

  // Esc / ⌘W 关闭浮窗（spec/06 § 5.1 路由）
  useHotkeys('esc, meta+w', () => {
    win.hide().catch(() => {});
  });
}
