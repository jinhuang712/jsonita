import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys';
import { useLocaleSync } from './i18n/useLocaleSync';
import { AccessibilityModal } from './permissions/AccessibilityModal';
import { SettingsModal } from './settings/SettingsModal';
import { FloatingWindow } from './shell/FloatingWindow';
import { useUiStore } from './store/ui';

export function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const setSettingsModalOpen = useUiStore((s) => s.setSettingsModalOpen);
  useGlobalHotkeys();
  useLocaleSync();

  // 首次 mount：查 ⌘⇧J 注册状态 + listen 后续 event
  useEffect(() => {
    invoke<boolean>('shortcut_status')
      .then((ok) => {
        if (!ok) setModalOpen(true);
      })
      .catch(() => {
        /* 命令不可用 ── 老版本 / dev 阶段 */
      });

    let unlisten1: UnlistenFn | null = null;
    let unlisten2: UnlistenFn | null = null;
    listen('permission:accessibility_missing', () => setModalOpen(true)).then(
      (fn) => {
        unlisten1 = fn;
      },
    );
    // tray Settings 项 / ⌘, 触发：打开 Settings Modal
    listen('tray:open-settings', () => setSettingsModalOpen(true)).then((fn) => {
      unlisten2 = fn;
    });

    return () => {
      if (unlisten1) unlisten1();
      if (unlisten2) unlisten2();
    };
  }, [setSettingsModalOpen]);

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
