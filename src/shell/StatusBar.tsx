import { useTranslation } from 'react-i18next';
import { useAiStore } from '../store/ai';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';

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
  const aiStatus = useAiStore((s) => s.status);
  const activePane = useUiStore((s) => s.activePane);

  let left: React.ReactNode;
  if (activePane === 'ai-fix' && aiStatus !== 'idle') {
    const aiLabel =
      aiStatus === 'requesting' ? t('statusBar.aiFixing') : t('statusBar.aiReview');
    left = (
      <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
        ● {aiLabel}
      </span>
    );
  } else {
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
