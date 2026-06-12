import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { useDebouncedTransform } from '../hooks/useDebouncedTransform';
import { useSmartWidth } from '../hooks/useSmartWidth';
import { on } from '../ipc/events';
import { AiFixPane } from '../panes/AiFixPane';
import { SettingsView } from '../settings/SettingsView';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore } from '../store/ui';
import { useEffectiveTheme } from '../theme/useEffectiveTheme';
import { TreeView } from '../tree/TreeView';
import { StatusBar } from './StatusBar';
import { SinglePaneHint } from './SinglePaneHint';
import { TabBar } from './TabBar';
import { WindowResizeHandles } from './WindowResizeHandles';

/**
 * 浮窗主壳 — TabBar 上 + 左右双栏（input | output）+ StatusBar 下。
 *
 * Spec ref: design/01_mockups.md § 1 主浮窗 6 态 · design/08 § 5 编辑器 ↔ 树同步
 * M1-N4：双栏 CSS Grid 静态 50/50；M1-N9 起加智能缩放 + 可拖边 resize。
 */
export function FloatingWindow() {
  const { t } = useTranslation('shell');
  const content = useEditorStore((s) => s.content);
  const outputText = useEditorStore((s) => s.outputText);
  const setContent = useEditorStore((s) => s.setContent);
  const editorError = useEditorStore((s) => s.error);
  const activePane = useUiStore((s) => s.activePane);
  const settingsOpen = useUiStore((s) => s.settingsViewOpen);
  const editorFontSize = useUiStore((s) => s.editorFontSize);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);
  const editorSoftWrap = useSettingsStore((s) => s.settings.editorSoftWrap);
  const effectiveTheme = useEffectiveTheme();
  const [motionPhase, setMotionPhase] = useState<'shown' | 'hiding'>('shown');

  // editor onChange → debounce 300ms → IPC → 更新 store output/error
  useDebouncedTransform();
  // 智能缩放：内容 / 字号变化后自动调整窗口（design/06 § 7）
  useSmartWidth();

  useEffect(() => {
    let unlistenShown: (() => void) | undefined;
    let unlistenHide: (() => void) | undefined;
    on('window:shown', () => setMotionPhase('shown')).then((fn) => {
      unlistenShown = fn;
    });
    on('window:will-hide', () => setMotionPhase('hiding')).then((fn) => {
      unlistenHide = fn;
    });
    return () => {
      unlistenShown?.();
      unlistenHide?.();
    };
  }, []);

  // Tree 是当前输入内容的视图；不依赖 output preview，避免非法状态时静默退回编辑器。
  const shouldRenderTree = activePane === 'tree';
  const showTreeInSinglePane = singlePaneMode && shouldRenderTree;
  const treeState = useMemo(() => {
    if (!shouldRenderTree) return { kind: 'idle' as const };
    if (content.trim() === '') return { kind: 'empty' as const };
    try {
      return { kind: 'valid' as const, data: JSON.parse(content) as unknown };
    } catch {
      return { kind: 'invalid' as const };
    }
  }, [content, shouldRenderTree]);
  const chromeFontDelta = editorFontSize - 13;
  const chromeXsFontSize = clamp(11 + chromeFontDelta * 0.18, 10, 12.5);
  const chromeSmFontSize = clamp(12.5 + chromeFontDelta * 0.22, 11, 14);

  return (
    <div
      className={
        motionPhase === 'hiding'
          ? 'jsonita-floating-window jsonita-floating-window-hiding'
          : 'jsonita-floating-window jsonita-floating-window-shown'
      }
      style={{
        height: '100%',
        background: 'var(--glass-bg)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ['--fs-editor' as string]: `${editorFontSize}px`,
        ['--fs-tree' as string]: `${Math.max(10, editorFontSize - 1)}px`,
        ['--fs-xs' as string]: `${chromeXsFontSize}px`,
        ['--fs-sm' as string]: `${chromeSmFontSize}px`,
      }}
    >
      {settingsOpen ? (
        <SettingsView />
      ) : (
        <>
          <TabBar />
          <div
            className="jsonita-pane-transition"
            style={{
              flex: 1,
              display: 'grid',
              gridTemplateColumns: singlePaneMode ? '1fr' : '1fr 1fr',
              minHeight: 0,
              padding: '2px 0',
            }}
          >
            <div
              className={
                singlePaneMode
                  ? 'jsonita-pane jsonita-pane-input jsonita-pane-single'
                  : 'jsonita-pane jsonita-pane-input'
              }
            >
              {singlePaneMode && activePane === 'ai-fix' ? (
                <AiFixPane />
              ) : showTreeInSinglePane ? (
                <TreePanel state={treeState} />
              ) : (
                <EditorFrame
                  empty={content.trim() === ''}
                  mark="{ }"
                  title={t('editor.inputEmptyTitle')}
                  meta={t('editor.inputEmptyMeta')}
                >
                  <Editor
                    theme={effectiveTheme}
                    value={content}
                    onChange={setContent}
                    softWrap={editorSoftWrap}
                    error={editorError}
                  />
                </EditorFrame>
              )}
            </div>
            {!singlePaneMode && (
              <div className="jsonita-pane jsonita-pane-output">
                {activePane === 'ai-fix' ? (
                  <AiFixPane />
                ) : activePane === 'tree' ? (
                  <TreePanel state={treeState} />
                ) : (
                  <EditorFrame
                    empty={outputText.trim() === ''}
                    mark="↳"
                    title={t('editor.outputEmptyTitle')}
                    meta={t('editor.outputEmptyMeta')}
                  >
                    <Editor
                      theme={effectiveTheme}
                      value={outputText}
                      readOnly={true}
                      softWrap={editorSoftWrap}
                    />
                  </EditorFrame>
                )}
              </div>
            )}
          </div>
          <SinglePaneHint />
          <StatusBar />
        </>
      )}
      <WindowResizeHandles />
    </div>
  );
}

function EditorFrame({
  children,
  empty,
  mark,
  title,
  meta,
}: {
  children: React.ReactNode;
  empty: boolean;
  mark: string;
  title: string;
  meta: string;
}) {
  return (
    <div className="jsonita-editor-shell">
      {empty && (
        <div className="jsonita-editor-empty-hint" aria-hidden="true">
          <div className="jsonita-editor-empty-mark">{mark}</div>
          <div className="jsonita-editor-empty-title">{title}</div>
          <div className="jsonita-editor-empty-meta">{meta}</div>
        </div>
      )}
      {children}
    </div>
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

type TreePanelState =
  | { kind: 'idle' }
  | { kind: 'valid'; data: unknown }
  | { kind: 'empty' }
  | { kind: 'invalid' };

function TreePanel({ state }: { state: TreePanelState }) {
  if (state.kind === 'valid') {
    return <TreeView data={state.data} />;
  }

  return (
    <div
      className="jsonita-tree-container"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color: state.kind === 'invalid' ? 'var(--danger)' : 'var(--text-faint)',
      }}
    >
      <div>
        <div style={{ fontSize: 'calc(var(--fs-tree) + 8px)', marginBottom: 6 }}>
          {state.kind === 'invalid' ? 'Tree unavailable' : '{ }'}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {state.kind === 'invalid' ? 'Fix JSON to view the tree' : 'Paste JSON to view the tree'}
        </div>
      </div>
    </div>
  );
}
