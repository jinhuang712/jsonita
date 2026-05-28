import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatAccelerator } from '../keyboard/accelerators';
import { on } from '../ipc/events';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';

const HISTORY_HINT_HOLD_MS = 2600;

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
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const [historyHintVisible, setHistoryHintVisible] = useState(true);
  const historyHintTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const revealThenHide = () => {
      if (historyHintTimerRef.current !== null) {
        window.clearTimeout(historyHintTimerRef.current);
      }
      setHistoryHintVisible(true);
      historyHintTimerRef.current = window.setTimeout(() => {
        setHistoryHintVisible(false);
        historyHintTimerRef.current = null;
      }, HISTORY_HINT_HOLD_MS);
    };

    let unlisten: (() => void) | undefined;
    revealThenHide();
    on('window:shown', revealThenHide).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
      if (historyHintTimerRef.current !== null) {
        window.clearTimeout(historyHintTimerRef.current);
      }
    };
  }, []);

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
      <div style={{ display: 'flex', gap: 8, color: 'var(--text-muted)' }}>
        <button
          onClick={() => setHistoryModalOpen(true)}
          onMouseEnter={() => setHistoryHintVisible(true)}
          onMouseLeave={() => setHistoryHintVisible(false)}
          onFocus={() => setHistoryHintVisible(true)}
          onBlur={() => setHistoryHintVisible(false)}
          className={historyHintVisible ? 'jsonita-history-button jsonita-history-button-hint-visible' : 'jsonita-history-button'}
          aria-label={t('actions.openHistory')}
          title={formatAccelerator('CmdOrCtrl+Y')}
        >
          <span className="jsonita-history-shortcut">{formatAccelerator('CmdOrCtrl+Y')}</span>
          <span>{t('actions.history')}</span>
        </button>
      </div>
    </div>
  );
}
