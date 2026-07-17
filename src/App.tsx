import { useEffect, useState } from 'react';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useGlobalHotkeys } from './hooks/useGlobalHotkeys';
import { useLocaleSync } from './i18n/useLocaleSync';
import { settings as settingsApi, shortcuts } from './ipc/commands';
import { on } from './ipc/events';
import { ShortcutPermissionModal } from './permissions/ShortcutPermissionModal';
import { FloatingWindow } from './shell/FloatingWindow';
import { GlyphSymbols } from './components/GlyphSymbols';
import { useSettingsStore } from './store/settings';
import { useUiStore } from './store/ui';

export function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setSettingsViewOpen = useUiStore((s) => s.setSettingsViewOpen);
  const setSettings = useSettingsStore((s) => s.setSettings);
  useGlobalHotkeys();
  useLocaleSync();

  // 启动期拉一次 settings ── 避免 store 用 DEFAULT_SETTINGS 状态下 TabBar
  // 把 aiEnabled 当 false（哪怕 settings.json 里其实是 true）
  useEffect(() => {
    settingsApi.getAll().then(setSettings).catch(() => {});
  }, [setSettings]);

  // settings:changed：后端任意来源 patch 后同步到 store（单一权威），不依赖 Settings 页是否挂载。
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | null = null;
    on('settings:changed', (payload) => setSettings(payload))
      .then((fn) => {
        if (disposed) {
          fn();
          return;
        }
        unlisten = fn;
      })
      .catch(() => {});
    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [setSettings]);

  // 首次 mount：查 ⌘⇧J 注册状态 + listen 后续 event
  useEffect(() => {
    shortcuts
      .status()
      .then((ok) => {
        if (!ok) setModalOpen(true);
      })
      .catch(() => {
        /* 命令不可用 ── 老版本 / dev 阶段 */
      });

    let disposed = false;
    let unlisten: UnlistenFn | null = null;
    // tray Settings 项 / ⌘, 触发：切到 Settings 页
    listen('tray:open-settings', () => {
      setHistoryModalOpen(false);
      setSettingsViewOpen(true);
    })
      .then((fn) => {
        if (disposed) {
          fn();
          return;
        }
        unlisten = fn;
      })
      .catch(() => {});

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, [setHistoryModalOpen, setSettingsViewOpen]);

  // Modal 打开期间周期轮询：用户授权后自动 close（design/overview.md § 3.2 不需重启即可呼出）
  useEffect(() => {
    if (!modalOpen) return;
    const id = setInterval(async () => {
      try {
        const ok = await shortcuts.retry();
        if (ok) setModalOpen(false);
      } catch (_) {
        /* ignore */
      }
    }, 2000);
    return () => clearInterval(id);
  }, [modalOpen]);

  return (
    <>
      <GlyphSymbols />
      <FloatingWindow />
      {modalOpen && <ShortcutPermissionModal onClose={() => setModalOpen(false)} />}
    </>
  );
}
