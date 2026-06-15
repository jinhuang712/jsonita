import { useTranslation } from 'react-i18next';
import { useEditorStore } from '../store/editor';

/**
 * 底部状态栏 — 4 态文案（valid / error / empty / large）。
 *
 * 视觉锚：design/01_mockups.md § 2 状态栏 4 态对照
 * Spec ref: design/04_components.md § 4.2 StatusBar
 */
export function StatusBar() {
  const { t } = useTranslation('shell');
  const status = useEditorStore((s) => s.status);
  const bytes = useEditorStore((s) => s.bytes);
  const lines = useEditorStore((s) => s.lines);

  let left: React.ReactNode;
  switch (status) {
    case 'valid':
      left = (
        <span>
          <span style={{ color: 'var(--ok)' }}>●</span> {t('statusBar.valid')} ·{' '}
          <span style={{ fontFamily: 'var(--font-mono-ui)' }}>{lines}</span> lines ·{' '}
          <span style={{ fontFamily: 'var(--font-mono-ui)' }}>{bytes}</span> bytes
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
          ● Large file · <span style={{ fontFamily: 'var(--font-mono-ui)' }}>{bytes}</span> bytes
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
        justifyContent: 'flex-start',
        alignItems: 'center',
        minHeight: 33,
        padding: '5px 12px',
        fontSize: 'var(--fs-xs)',
        fontFamily: 'var(--font-ui)',
        letterSpacing: 0,
        borderTop: '1px solid var(--border)',
        background: 'color-mix(in srgb, var(--surface-quiet) 30%, transparent)',
      }}
    >
      {left}
    </div>
  );
}
