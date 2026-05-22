import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';

/**
 * 底部状态栏 — 4 态文案（valid / error / empty / large）+ 右侧 History / Settings 入口。
 *
 * 视觉锚：spec/01_mockups.html § 2 状态栏 4 态对照
 * Spec ref: spec/04_components.html § 4.2 StatusBar
 */
export function StatusBar() {
  const { t } = useTranslation('shell');
  const status = useEditorStore((s) => s.status);
  const error = useEditorStore((s) => s.error);
  const bytes = useEditorStore((s) => s.bytes);
  const lines = useEditorStore((s) => s.lines);
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setSettingsModalOpen = useUiStore((s) => s.setSettingsModalOpen);

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
      left = error ? (
        <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
          ● Line {error.line}, Col {error.col}: {error.msg}
        </span>
      ) : (
        <span style={{ color: 'var(--danger)' }}>● error</span>
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
          style={btnStyle}
          aria-label="Open history"
        >
          History
        </button>
        <button
          onClick={() => setSettingsModalOpen(true)}
          style={btnStyle}
          aria-label="Open settings"
        >
          ⚙
        </button>
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  background: 'transparent',
  border: 'none',
  color: 'inherit',
  fontFamily: 'inherit',
  fontSize: 'inherit',
  cursor: 'pointer',
  padding: 0,
};
