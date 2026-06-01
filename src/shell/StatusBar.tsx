import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settings as settingsApi } from '../ipc/commands';
import { formatAccelerator } from '../keyboard/accelerators';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore } from '../store/ui';

/**
 * 底部状态栏 — 4 态文案（valid / error / empty / large）+ 右侧 History 入口。
 *
 * 视觉锚：spec/01_mockups.html § 2 状态栏 4 态对照
 * Spec ref: spec/04_components.html § 4.2 StatusBar
 */
export function StatusBar() {
  const { t } = useTranslation('shell');
  const status = useEditorStore((s) => s.status);
  const bytes = useEditorStore((s) => s.bytes);
  const lines = useEditorStore((s) => s.lines);
  const settings = useSettingsStore((s) => s.settings);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const [splitHintVisible, setSplitHintVisible] = useState(false);
  const [historyHintVisible, setHistoryHintVisible] = useState(false);

  const toggleSinglePaneMode = () => {
    settingsApi
      .set({ singlePaneMode: !settings.singlePaneMode })
      .then(setSettings)
      .catch(() => {});
  };

  let left: React.ReactNode;
  switch (status) {
    case 'valid':
      left = (
        <span>
          <span style={{ color: 'var(--ok)' }}>●</span> {t('statusBar.valid')} · {lines}{' '}
          lines · {bytes} bytes
        </span>
      );
      break;
    case 'error':
      left = (
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
          ● {t('statusBar.invalid')}
        </span>
      );
      break;
    case 'large':
      left = (
        <span style={{ color: 'var(--warn)', fontWeight: 600 }}>
          ● Large file · {bytes} bytes
        </span>
      );
      break;
    default:
      left = <span style={{ color: 'var(--text-faint)' }}>— {t('statusBar.empty')}</span>;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '6px 12px',
        fontSize: 'var(--fs-xs)',
        fontFamily: 'var(--font-mono)',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      {left}
      <div style={{ display: 'flex', gap: 10, color: 'var(--text-muted)' }}>
        <button
          type="button"
          onClick={toggleSinglePaneMode}
          onMouseEnter={() => setSplitHintVisible(true)}
          onMouseLeave={() => setSplitHintVisible(false)}
          onFocus={() => setSplitHintVisible(true)}
          onBlur={() => setSplitHintVisible(false)}
          className={splitHintVisible ? 'jsonita-statusbar-action jsonita-statusbar-action-hint-visible' : 'jsonita-statusbar-action'}
          aria-label={
            settings.singlePaneMode
              ? t('actions.switchToSplitPanel')
              : t('actions.switchToSinglePanel')
          }
          title={formatAccelerator(settings.shortcutSplitToggle)}
        >
          <span className="jsonita-statusbar-shortcut">
            {formatAccelerator(settings.shortcutSplitToggle)}
          </span>
          <span>
            {settings.singlePaneMode
              ? t('actions.switchToSplitPanel')
              : t('actions.switchToSinglePanel')}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setHistoryModalOpen(true)}
          onMouseEnter={() => setHistoryHintVisible(true)}
          onMouseLeave={() => setHistoryHintVisible(false)}
          onFocus={() => setHistoryHintVisible(true)}
          onBlur={() => setHistoryHintVisible(false)}
          className={historyHintVisible ? 'jsonita-statusbar-action jsonita-statusbar-action-hint-visible' : 'jsonita-statusbar-action'}
          aria-label={t('actions.openHistory')}
          title={formatAccelerator('CmdOrCtrl+Y')}
        >
          <span className="jsonita-statusbar-shortcut">{formatAccelerator('CmdOrCtrl+Y')}</span>
          <span>{t('actions.history')}</span>
        </button>
      </div>
    </div>
  );
}
