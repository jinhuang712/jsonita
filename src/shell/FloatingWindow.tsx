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
 * Spec ref: design/screens.md § Editor Workspace
 * 壳层样式见 global.css `.jsonita-floating-window`；此处只注入随字号变化的变量。
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
  // 智能缩放：内容 / 字号变化后自动调整窗口
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
            className={
              singlePaneMode
                ? 'jsonita-workspace jsonita-workspace-single jsonita-pane-transition'
                : 'jsonita-workspace jsonita-pane-transition'
            }
          >
            <div className="jsonita-pane">
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
              <div className="jsonita-pane">
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

  const invalid = state.kind === 'invalid';
  return (
    <div
      className={
        invalid
          ? 'jsonita-tree-container jsonita-tree-empty jsonita-tree-empty-invalid'
          : 'jsonita-tree-container jsonita-tree-empty'
      }
    >
      <div>
        <div className="jsonita-tree-empty-glyph">
          {invalid ? t('tree.unavailable') : '{ }'}
        </div>
        <div className="jsonita-tree-empty-text">
          {invalid ? t('tree.fixToView') : t('tree.pasteToView')}
        </div>
      </div>
    </div>
  );
}
