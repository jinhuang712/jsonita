import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { useDebouncedTransform } from '../hooks/useDebouncedTransform';
import { useSmartWidth } from '../hooks/useSmartWidth';
import { AiFixPane } from '../panes/AiFixPane';
import { HistoryModal } from '../history/HistoryModal';
import { SettingsView } from '../settings/SettingsView';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore } from '../store/ui';
import { useEffectiveTheme } from '../theme/useEffectiveTheme';
import { TreeView } from '../tree/TreeView';
import { StatusBar } from './StatusBar';
import { ShortcutGlyph } from '../components/ShortcutGlyph';
import { SinglePaneHint } from './SinglePaneHint';
import { TabBar } from './TabBar';
import { WindowResizeHandles } from './WindowResizeHandles';

/**
 * 浮窗主壳 — TabBar 上 + 左右双栏（input | output）+ StatusBar 下。
 *
 * Spec ref: design/screens.md § 1 主浮窗 6 态 · design/screens.md § 5 编辑器 ↔ 树同步
 * M1-N4：双栏 CSS Grid 静态 50/50；M1-N9 起加智能缩放 + 可拖边 resize。
 */
export function FloatingWindow() {
  const { t } = useTranslation('shell');
  const content = useEditorStore((s) => s.content);
  const outputText = useEditorStore((s) => s.outputText);
  const setContent = useEditorStore((s) => s.setContent);
  const editorError = useEditorStore((s) => s.error);
  const activePane = useUiStore((s) => s.activePane);
  const historyOpen = useUiStore((s) => s.historyModalOpen);
  const settingsOpen = useUiStore((s) => s.settingsViewOpen);
  const escCloseHintVisible = useUiStore((s) => s.escCloseHintVisible);
  const escCloseHintRenderKey = useUiStore((s) => s.escCloseHintRenderKey);
  const editorFontSize = useUiStore((s) => s.editorFontSize);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);
  const editorSoftWrap = useSettingsStore((s) => s.settings.editorSoftWrap);
  const effectiveTheme = useEffectiveTheme();

  // editor onChange → debounce 300ms → IPC → 更新 store output/error
  useDebouncedTransform();
  // 智能缩放：内容 / 字号变化后自动调整窗口（design/overview.md § 7）
  useSmartWidth();

  // 窗口显隐动画走原生 NSWindow.alphaValue（见 window/mod.rs animated_show/hide），
  // 整窗（vibrancy + webview）作为单一合成单元淡变，前端不再做窗口级 opacity 动画。

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
  const chromeFontDelta = editorFontSize - 15;
  const chromeXsFontSize = clamp(12 + chromeFontDelta * 0.18, 11.5, 13.2);
  const chromeSmFontSize = clamp(13.5 + chromeFontDelta * 0.22, 12.5, 15);

  return (
    <div
      className="jsonita-floating-window"
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
      ) : historyOpen ? (
        <HistoryModal />
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
                <TreePanel state={treeState} softWrap={editorSoftWrap} />
              ) : (
                <EditorFrame>
                  <Editor
                    focusOnWindowShown
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
                  <TreePanel state={treeState} softWrap={editorSoftWrap} />
                ) : (
                  <EditorFrame>
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
          {escCloseHintVisible && (
            <EscCloseHint
              key={escCloseHintRenderKey}
              label={t('escCloseHint.doubleEscToClose')}
            />
          )}
          <StatusBar />
        </>
      )}
      <WindowResizeHandles />
    </div>
  );
}

function EditorFrame({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="jsonita-editor-shell">{children}</div>;
}

function EscCloseHint({ label }: { label: string }) {
  return (
    <div className="jsonita-esc-close-hint" role="status" aria-live="polite">
      <span className="jsonita-esc-key-combo" aria-hidden="true">
        <ShortcutGlyph accelerator="Escape" decorative />
        <ShortcutGlyph accelerator="Escape" decorative />
      </span>
      <span>{label}</span>
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

function TreePanel({ state, softWrap }: { state: TreePanelState; softWrap?: boolean }) {
  const { t } = useTranslation('shell');
  if (state.kind === 'valid') {
    return <TreeView data={state.data} softWrap={softWrap} />;
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
          {state.kind === 'invalid' ? t('tree.unavailable') : '{ }'}
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {state.kind === 'invalid' ? t('tree.fixToView') : t('tree.pasteToView')}
        </div>
      </div>
    </div>
  );
}
