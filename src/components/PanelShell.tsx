import { useTranslation } from 'react-i18next';
import { Editor } from '../editor/Editor';
import { useEditorStore } from '../store/editor';

/**
 * 浮窗外壳 — M1-N3 内嵌 CodeMirror Editor 实例。
 *
 * 视觉锚：spec/01_mockups.html § 1 主浮窗 6 态。
 * M1-N4 起：拆 SplitPane 左右双栏 + TabBar / StatusBar 真实化（当前仅单栏 Editor 起步）。
 */
export function PanelShell() {
  const { t } = useTranslation('panes');
  const content = useEditorStore((s) => s.content);
  const setContent = useEditorStore((s) => s.setContent);

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
      }}
    >
      <Editor
        theme="light"
        value={content}
        onChange={setContent}
        softWrap={true}
        placeholderText={t('empty.title')}
      />
    </div>
  );
}
