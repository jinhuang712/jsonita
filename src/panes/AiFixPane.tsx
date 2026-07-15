import { useEffect } from 'react';
import { ai as aiApi } from '../ipc/commands';
import { isJsonitaError } from '../ipc/error';
import { useAiStore } from '../store/ai';
import { useEditorStore } from '../store/editor';
import { useUiStore } from '../store/ui';
import { acceptAiFix } from './aiFixActions';
import { ActionButton } from '../components/ActionButton';
import { ShortcutGlyph } from '../components/ShortcutGlyph';
import { DiffView } from './DiffView';

/**
 * AI Fix orchestrator — tab 切换到 ai-fix 时自动触发 ai_fix，loading → DiffView → Accept/Reject。
 *
 * Spec ref: spec/M02-ai-repair.md 状态机 · design/01_mockups.md DiffView 视觉
 */
export function AiFixPane() {
  const status = useAiStore((s) => s.status);
  const before = useAiStore((s) => s.before);
  const after = useAiStore((s) => s.after);
  const aiError = useAiStore((s) => s.error);
  const startFix = useAiStore((s) => s.startFix);
  const setSuccess = useAiStore((s) => s.setSuccess);
  const setError = useAiStore((s) => s.setError);
  const aiReset = useAiStore((s) => s.reset);

  const content = useEditorStore((s) => s.content);
  const editorError = useEditorStore((s) => s.error);
  const setContent = useEditorStore((s) => s.setContent);
  const setActivePane = useUiStore((s) => s.setActivePane);

  const paneClassName = 'jsonita-ai-fix-pane';

  // 自动触发：tab 切到 ai-fix 且当前 status=idle 时
  useEffect(() => {
    if (status !== 'idle') return;
    if (content.trim() === '') return;
    startFix(content);
    aiApi
      .fix({
        text: content,
        errorLine: editorError?.line,
        errorCol: editorError?.col,
        errorMsg: editorError?.msg,
        requestId: crypto.randomUUID(),
      })
      .then((resp) => {
        setSuccess(resp.fixed);
      })
      .catch((e) => {
        if (isJsonitaError(e)) {
          if (e.kind === 'RateLimit') {
            setError(`Rate limited · retry in ${e.data.retryAfterSec}s`);
          } else if (e.kind === 'Http') {
            setError(`HTTP ${e.data.status}: ${e.data.body.slice(0, 120)}`);
          } else if (e.kind === 'Secrets') {
            setError(`No API key configured (Settings → AI)`);
          } else if (e.kind === 'AiInvalidJson') {
            setError(`AI returned invalid JSON`);
          } else if (e.kind === 'AiDisabled') {
            setError(`AI Fix is disabled. Enable it in Settings → AI.`);
          } else if (e.kind === 'Io' || e.kind === 'Sqlite') {
            setError(`${e.kind}: ${e.data}`);
          } else {
            setError(e.kind);
          }
        } else {
          setError(String(e));
        }
      });
    // 依赖项有意只用 status，避免 content 变化时重发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const reject = () => {
    aiReset();
    setActivePane('format');
  };

  if (status === 'requesting') {
    return (
      <div
        className={paneClassName}
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: 'var(--fs-sm)',
        }}
      >
        AI Fix in progress…
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className={paneClassName} style={{ padding: 16 }}>
        <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-sm)', marginBottom: 8 }}>
          Error · {aiError ?? 'AI Fix failed'}
        </div>
        <ActionButton variant="secondary" onClick={reject}>
          Close
        </ActionButton>
      </div>
    );
  }

  if (status === 'awaiting-decision') {
    return (
      <div className={paneClassName} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, minHeight: 0 }}>
          <DiffView before={before} after={after} />
        </div>
        <div
          style={{
            display: 'flex',
            gap: 6,
            justifyContent: 'flex-end',
            padding: '8px 14px',
            background: 'var(--bg)',
            borderTop: '1px solid var(--border)',
          }}
        >
          <ActionButton variant="secondary" onClick={reject} title="Esc">
            Cancel
          </ActionButton>
          <ActionButton variant="primary" onClick={() => acceptAiFix(after, setContent, aiReset, setActivePane)} title="Cmd+Enter">
            <ShortcutGlyph accelerator="CmdOrCtrl+Enter" decorative />
            Accept
          </ActionButton>
        </div>
      </div>
    );
  }

  return null;
}

