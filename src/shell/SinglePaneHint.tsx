import { useTranslation } from 'react-i18next';
import { ShortcutGlyph } from '../components/ShortcutGlyph';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore, type Pane, type SinglePaneApplyState } from '../store/ui';

const PANE_LABEL_KEY: Record<Pane, string> = {
  format: 'format',
  minify: 'minify',
  tree: 'tree',
  'json-to-str': 'jsonToStr',
  'ai-fix': 'aiFix',
};

const STATE_CLASS: Record<SinglePaneApplyState, string> = {
  idle: '',
  running: 'jsonita-single-pane-hint-running',
  success: 'jsonita-single-pane-hint-success',
  error: 'jsonita-single-pane-hint-error',
};

/** 单栏模式下悬浮在状态栏上方的执行提示：键帽 + 一句话。 */
export function SinglePaneHint() {
  const { t } = useTranslation(['shell', 'panes']);
  const settings = useSettingsStore((s) => s.settings);
  const editorStatus = useEditorStore((s) => s.status);
  const activePane = useUiStore((s) => s.activePane);
  const state = useUiStore((s) => s.singlePaneApplyState);

  if (!settings.singlePaneMode || activePane === 'tree' || activePane === 'ai-fix') return null;
  if (editorStatus === 'empty') return null;
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

  const className = [
    'jsonita-single-pane-hint',
    isAiFixPrimary ? 'jsonita-single-pane-hint-ai' : STATE_CLASS[state],
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div aria-live="polite" className={className} style={{ bottom: 44, padding: '6px 10px' }}>
      <ShortcutGlyph accelerator="CmdOrCtrl+Enter" />
      <span className="jsonita-single-pane-hint-label">{label}</span>
    </div>
  );
}
