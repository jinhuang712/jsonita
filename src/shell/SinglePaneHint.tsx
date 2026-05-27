import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '../store/settings';
import { useUiStore, type Pane, type SinglePaneApplyState } from '../store/ui';

const PANE_LABEL_KEY: Record<Pane, string> = {
  format: 'format',
  minify: 'minify',
  tree: 'tree',
  'json-to-str': 'jsonToStr',
  'str-to-json': 'strToJson',
  'ai-fix': 'aiFix',
};

const STATE_COLOR: Record<SinglePaneApplyState, string> = {
  idle: 'var(--text-muted)',
  running: 'var(--primary)',
  success: 'var(--ok)',
  error: 'var(--danger)',
};

export function SinglePaneHint() {
  const { t } = useTranslation(['shell', 'panes']);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);
  const activePane = useUiStore((s) => s.activePane);
  const state = useUiStore((s) => s.singlePaneApplyState);

  if (!singlePaneMode || activePane === 'tree' || activePane === 'ai-fix') return null;

  const pane = t(`panes:tab.${PANE_LABEL_KEY[activePane]}`);
  const label =
    state === 'running'
      ? t('shell:singlePane.running', { pane })
      : state === 'success'
        ? t('shell:singlePane.applied', { pane })
        : state === 'error'
          ? t('shell:singlePane.failed', { pane })
          : t('shell:singlePane.run', { pane });

  return (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        right: 12,
        bottom: 34,
        zIndex: 'var(--z-sticky)',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        maxWidth: 'calc(100% - 24px)',
        padding: '5px 8px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        background: 'color-mix(in srgb, var(--bg-card) 88%, transparent)',
        boxShadow: 'var(--shadow-sm)',
        color: STATE_COLOR[state],
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-xs)',
        lineHeight: 1.3,
        pointerEvents: 'none',
        whiteSpace: 'normal',
      }}
    >
      <kbd
        style={{
          padding: '1px 5px',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-strong)',
          background: 'var(--bg)',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        ⌘↵
      </kbd>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{label}</span>
    </div>
  );
}
