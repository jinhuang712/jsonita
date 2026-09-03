import { useEffect, useRef } from 'react';
import { ai as aiApi } from '../ipc/commands';
import { isMacPlatform } from '../keyboard/accelerators';
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
 * Spec ref: CLAUDE.md 契约段 状态机 · design/screens.md § AI Fix
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

  // 防 StrictMode 下同一渲染闭包（status 恒为 idle）双发请求。
  const inFlightRef = useRef(false);

  // 自动触发：tab 切到 ai-fix 且当前 status=idle 时
  useEffect(() => {
    if (status !== 'idle') return;
    if (content.trim() === '') return;
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    // 记录请求时的输入；resolve 时若编辑器内容已变则视为陈旧响应丢弃，
    // 避免用旧输入的 diff 覆盖，或让用户 Accept 回填旧内容。
    const requestedFor = content;
    startFix(content);
    aiApi
      .fix({
        text: content,
        errorLine: editorError?.line,
        errorCol: editorError?.col,
        errorMsg: editorError?.msg,
      })
      .then((resp) => {
        if (useEditorStore.getState().content !== requestedFor) return;
        setSuccess(resp.fixed);
      })
      .catch((e) => {
        if (useEditorStore.getState().content !== requestedFor) return;
        if (isJsonitaError(e)) {
          if (e.kind === 'RateLimit') {
            setError(`Rate limited · retry in ${e.data.retryAfterSec}s`);
          } else if (e.kind === 'Http') {
            setError(`HTTP ${e.data.status}: ${e.data.body.slice(0, 120)}`);
          } else if (e.kind === 'Secrets') {
            setError(`No API key configured (Settings → AI)`);
          } else if (e.kind === 'AiCannotRepair') {
            const reason = e.data.reason?.trim().slice(0, 160);
            setError(reason ? `AI couldn't repair this · ${reason}` : `AI couldn't repair this input`);
          } else if (e.kind === 'AiInvalidJson') {
            setError(`AI returned invalid JSON`);
          } else if (e.kind === 'AiDisabled') {
            setError(`AI Fix is disabled. Enable it in Settings → AI.`);
          } else if (e.kind === 'Parse') {
            setError(`Invalid JSON · line ${e.data.line}, col ${e.data.col}`);
          } else if (e.kind === 'UnwrapTimeout') {
            setError(`Unwrap timed out after ${e.data.ms}ms`);
          } else if (e.kind === 'Io' || e.kind === 'Sqlite') {
            setError(`${e.kind}: ${e.data}`);
          } else {
            setError(e.kind);
          }
        } else {
          setError(String(e));
        }
      })
      .finally(() => {
        inFlightRef.current = false;
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
      <div className="jsonita-ai-fix-pane">
        <div className="jsonita-ai-fix-center">
          <div className="jsonita-aifix-wait" role="status" aria-label="Repairing your JSON">
            <div className="jsonita-aifix-skeleton" aria-hidden="true">
              <span className="jsonita-aifix-brace">{'{'}</span>
              <span className="jsonita-aifix-line" style={{ width: 128 }} />
              <span className="jsonita-aifix-line" style={{ width: 186, animationDelay: '0.16s' }} />
              <span className="jsonita-aifix-line" style={{ width: 96, animationDelay: '0.32s' }} />
              <span className="jsonita-aifix-brace">{'}'}</span>
            </div>
            <div className="jsonita-aifix-caption">Repairing your JSON…</div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="jsonita-ai-fix-pane">
        <div className="jsonita-ai-fix-center" role="alert">
          <div className="jsonita-ai-fix-message">
            <div className="jsonita-ai-fix-message-title">AI Fix didn't finish</div>
            <div className="jsonita-ai-fix-message-body">{aiError ?? 'AI Fix failed'}</div>
            <div className="jsonita-ai-fix-message-actions">
              <ActionButton variant="secondary" onClick={reject}>
                Close
              </ActionButton>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'awaiting-decision') {
    return (
      <div className="jsonita-ai-fix-pane">
        <div className="jsonita-ai-fix-diff">
          <DiffView before={before} after={after} />
        </div>
        <div className="jsonita-ai-fix-footer">
          <ActionButton variant="secondary" onClick={reject} title="Esc">
            Cancel
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={() => acceptAiFix(after, before, setContent, aiReset, setActivePane)}
            title={isMacPlatform() ? 'Cmd+Enter' : 'Ctrl+Enter'}
          >
            <ShortcutGlyph accelerator="CmdOrCtrl+Enter" decorative />
            Accept
          </ActionButton>
        </div>
      </div>
    );
  }

  return null;
}
