import { useTranslation } from 'react-i18next';
import { useAiStore } from '../store/ai';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';

/**
 * 底部状态栏 — 4 态文案（valid / error / empty / large）+ AI Fix 进行态。
 *
 * 一颗 6px 圆点承担状态色，文字保持墨色；数字用等宽 + tabular。
 * 视觉锚：design/screens.md § Editor Workspace
 */
export function StatusBar() {
  const { t } = useTranslation('shell');
  const status = useEditorStore((s) => s.status);
  const bytes = useEditorStore((s) => s.bytes);
  const lines = useEditorStore((s) => s.lines);
  const aiStatus = useAiStore((s) => s.status);
  const activePane = useUiStore((s) => s.activePane);

  let dot = 'jsonita-status-dot';
  let content: React.ReactNode;

  if (activePane === 'ai-fix' && aiStatus !== 'idle') {
    dot += ' jsonita-status-dot-accent';
    content = (
      <span className="jsonita-status-text-accent">
        {aiStatus === 'requesting' ? t('statusBar.aiFixing') : t('statusBar.aiReview')}
      </span>
    );
  } else {
    switch (status) {
      case 'valid':
        dot += ' jsonita-status-dot-ok';
        content = (
          <>
            <span className="jsonita-status-text-strong">{t('statusBar.valid')}</span>
            <span className="jsonita-status-meta">
              <span className="jsonita-status-num">{lines}</span> {t('statusBar.lines')}
            </span>
            <span className="jsonita-status-meta">
              <span className="jsonita-status-num">{bytes}</span> {t('statusBar.bytes')}
            </span>
          </>
        );
        break;
      case 'error':
        dot += ' jsonita-status-dot-error';
        content = <span className="jsonita-status-text-error">{t('statusBar.invalid')}</span>;
        break;
      case 'large':
        dot += ' jsonita-status-dot-warn';
        content = (
          <>
            <span className="jsonita-status-text-warn">{t('statusBar.largeFile')}</span>
            <span className="jsonita-status-meta">
              <span className="jsonita-status-num">{bytes}</span> {t('statusBar.bytes')}
            </span>
          </>
        );
        break;
      default:
        content = <span className="jsonita-status-meta">{t('statusBar.empty')}</span>;
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="jsonita-statusbar"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <span className={dot} aria-hidden="true" />
      {content}
    </div>
  );
}
