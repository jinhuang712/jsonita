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
  const status = useEditorStore((s) => s.status);
  const activePane = useUiStore((s) => s.activePane);
  const editorFontSize = useUiStore((s) => s.editorFontSize);
  const singlePaneMode = useSettingsStore((s) => s.settings.singlePaneMode);
  const editorSoftWrap = useSettingsStore((s) => s.settings.editorSoftWrap);
  const effectiveTheme = useEffectiveTheme();

  // editor onChange → debounce 300ms → IPC → 更新 store output/error
  useDebouncedTransform();
  // 智能缩放：内容 / 字号变化后自动调整窗口（spec/06 § 7）
  useSmartWidth();

  // tree tab 时把 outputText parse 为 object 给 TreeView
  const treeData = useMemo(() => {
    if (activePane !== 'tree' || status !== 'valid') return null;
    try {
      return JSON.parse(outputText);
    } catch {
      return null;
    }
  }, [activePane, outputText, status]);
  const showTreeInSinglePane = singlePaneMode && activePane === 'tree' && treeData !== null;

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
          {showTreeInSinglePane ? (
            <TreeView data={treeData} />
          ) : (
            <Editor
              theme={effectiveTheme}
              value={content}
              onChange={setContent}
              softWrap={editorSoftWrap}
            />
          )}
        </div>
        {!singlePaneMode && (
          <div style={{ overflow: 'hidden' }}>
            {activePane === 'ai-fix' ? (
              <AiFixPane />
            ) : activePane === 'tree' && treeData !== null ? (
              <TreeView data={treeData} />
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
