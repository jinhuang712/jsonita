import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys';
import { AccessibilityModal } from './permissions/AccessibilityModal';
import { SettingsModal } from './settings/SettingsModal';
import { FloatingWindow } from './shell/FloatingWindow';

export function App() {
  const [modalOpen, setModalOpen] = useState(false);
  useGlobalHotkeys();

  // 首次 mount：查 ⌘⇧J 注册状态 + listen 后续 event
  useEffect(() => {
    invoke<boolean>('shortcut_status')
      .then((ok) => {
        if (!ok) setModalOpen(true);
      })
      .catch(() => {
        /* 命令不可用 ── 老版本 / dev 阶段 */
      });

    let unlisten: UnlistenFn | null = null;
    listen('permission:accessibility_missing', () => setModalOpen(true)).then(
      (fn) => {
        unlisten = fn;
      },
    );

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Modal 打开期间周期轮询：用户授权后自动 close（spec/07 § 3.2 不需重启即可呼出）
  useEffect(() => {
    if (!modalOpen) return;
    const id = setInterval(async () => {
      try {
        const ok = await invoke<boolean>('shortcut_retry');
        if (ok) setModalOpen(false);
      } catch (_) {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(id);
  }, [modalOpen]);

  return (
    <>
      <FloatingWindow />
      <SettingsModal />
      {modalOpen && <AccessibilityModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
