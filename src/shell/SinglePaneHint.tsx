import { useTranslation } from 'react-i18next';
import { formatAccelerator } from '../keyboard/accelerators';
import { useEditorStore } from '../store/editor';
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
  const settings = useSettingsStore((s) => s.settings);
  const editorStatus = useEditorStore((s) => s.status);
  const activePane = useUiStore((s) => s.activePane);
  const state = useUiStore((s) => s.singlePaneApplyState);

  if (!settings.singlePaneMode || activePane === 'tree' || activePane === 'ai-fix') return null;
  if (editorStatus === 'error' && !settings.aiEnabled) return null;

  const isAiFixPrimary = editorStatus === 'error' && settings.aiEnabled;
  const pane = isAiFixPrimary
    ? t('panes:tab.aiFix')
    : t(`panes:tab.${PANE_LABEL_KEY[activePane]}`);
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
        border: isAiFixPrimary
          ? '1px solid color-mix(in srgb, var(--accent) 28%, var(--control-border))'
          : '1px solid var(--control-border)',
        borderRadius: 'var(--radius-md)',
        background: isAiFixPrimary
          ? 'color-mix(in srgb, var(--accent) 10%, var(--surface-raised))'
          : 'color-mix(in srgb, var(--surface-raised) 84%, transparent)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: isAiFixPrimary
          ? '0 6px 18px color-mix(in srgb, var(--accent) 8%, transparent), var(--shadow-sm)'
          : 'var(--shadow-sm)',
        color: isAiFixPrimary ? 'color-mix(in srgb, var(--accent) 82%, var(--text))' : STATE_COLOR[state],
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
          border: isAiFixPrimary
            ? '1px solid color-mix(in srgb, var(--accent) 32%, transparent)'
            : '1px solid var(--control-border)',
          background: isAiFixPrimary
            ? 'color-mix(in srgb, var(--accent) 8%, transparent)'
            : 'var(--control-bg)',
          color: isAiFixPrimary ? 'var(--accent)' : 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 'inherit',
        }}
      >
        {formatAccelerator('CmdOrCtrl+Enter')}
      </kbd>
      <span style={{ minWidth: 0, overflowWrap: 'anywhere' }}>{label}</span>
    </div>
  );
}
