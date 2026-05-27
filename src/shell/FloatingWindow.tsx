import { useMemo } from 'react';
import { Editor } from '../editor/Editor';
import { useDebouncedTransform } from '../hooks/useDebouncedTransform';
import { useSmartWidth } from '../hooks/useSmartWidth';
import { AiFixPane } from '../panes/AiFixPane';
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
 * Spec ref: spec/01_mockups.html § 1 主浮窗 6 态 · spec/08 § 5 编辑器 ↔ 树同步
 * M1-N4：双栏 CSS Grid 静态 50/50；M1-N9 起加智能缩放 + 可拖边 resize。
 */
export function FloatingWindow() {
  const content = useEditorStore((s) => s.content);
  const outputText = useEditorStore((s) => s.outputText);
  const setContent = useEditorStore((s) => s.setContent);
  const editorError = useEditorStore((s) => s.error);
  const activePane = useUiStore((s) => s.activePane);
  const editorFontSize = useUiStore((s) => s.editorFontSize);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);
  const editorSoftWrap = useSettingsStore((s) => s.settings.editorSoftWrap);
  const effectiveTheme = useEffectiveTheme();

  // editor onChange → debounce 300ms → IPC → 更新 store output/error
  useDebouncedTransform();
  // 智能缩放：内容 / 字号变化后自动调整窗口（spec/06 § 7）
  useSmartWidth();

  // Tree 是当前输入内容的视图；不依赖 output preview，避免非法状态时静默退回编辑器。
  const treeState = useMemo(() => {
    if (content.trim() === '') return { kind: 'empty' as const };
    try {
      return { kind: 'valid' as const, data: JSON.parse(content) as unknown };
    } catch {
      return { kind: 'invalid' as const };
    }
  }, [content]);
  const showTreeInSinglePane = singlePaneMode && activePane === 'tree';

  return (
    <div
      style={{
        height: '100%',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        ['--fs-editor' as string]: `${editorFontSize}px`,
        ['--fs-tree' as string]: `${Math.max(10, editorFontSize - 1)}px`,
      }}
    >
      <TabBar />
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: singlePaneMode ? '1fr' : '1fr 1fr',
          minHeight: 0,
        }}
      >
        <div
          style={{
            borderRight: singlePaneMode ? 'none' : '1px solid var(--border)',
            overflow: 'hidden',
          }}
        >
          {singlePaneMode && activePane === 'ai-fix' ? (
            <AiFixPane />
          ) : showTreeInSinglePane ? (
            <TreePanel state={treeState} />
          ) : (
            <Editor
              theme={effectiveTheme}
              value={content}
              onChange={setContent}
              softWrap={editorSoftWrap}
              error={editorError}
            />
          )}
        </div>
        {!singlePaneMode && (
          <div style={{ overflow: 'hidden' }}>
            {activePane === 'ai-fix' ? (
              <AiFixPane />
            ) : activePane === 'tree' ? (
              <TreePanel state={treeState} />
            ) : (
              <Editor
                theme={effectiveTheme}
                value={outputText}
                readOnly={true}
                softWrap={editorSoftWrap}
                placeholderText="→ output"
              />
            )}
          </div>
        )}
      </div>
      <SinglePaneHint />
      <StatusBar />
      <WindowResizeHandles />
    </div>
  );
}

type TreePanelState =
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
