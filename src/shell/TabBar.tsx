import { useTranslation } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useSettingsStore } from '../store/settings';
import { useUiStore, type Pane } from '../store/ui';

/**
 * 顶部 5 个功能 Tab + AI Fix（仅 parse error 时显示）。
 *
 * 视觉锚：spec/01_mockups.html § 1.1-1.5
 * Spec ref: spec/04_components.html § 4.1 TabBar
 */

const TABS: { id: Pane; key: string }[] = [
  { id: 'format', key: 'format' },
  { id: 'minify', key: 'minify' },
  { id: 'tree', key: 'tree' },
  { id: 'json-to-str', key: 'jsonToStr' },
  { id: 'str-to-json', key: 'strToJson' },
];

export function TabBar() {
  const { t } = useTranslation('panes');
  const active = useUiStore((s) => s.activePane);
  const showAiFix = useUiStore((s) => s.showAiFix);
  const setActive = useUiStore((s) => s.setActivePane);
  const aiEnabled = useSettingsStore((s) => s.settings.aiEnabled);
  const startDragging = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    getCurrentWindow().startDragging().catch(() => {});
  };

  return (
    <div
      role="tablist"
      aria-label="Pane tabs"
      onMouseDown={startDragging}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            tabIndex={isActive ? 0 : -1}
            onClick={() => setActive(tab.id)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              fontWeight: isActive ? 600 : 400,
              background: isActive ? 'var(--primary-soft)' : 'transparent',
              color: isActive ? 'var(--primary)' : 'var(--text-muted)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
            }}
          >
            {t(`tab.${tab.key}` as 'tab.format')}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      {showAiFix && (
        <button
          role="tab"
          aria-selected={active === 'ai-fix'}
          aria-disabled={!aiEnabled}
          tabIndex={active === 'ai-fix' ? 0 : -1}
          onClick={() => aiEnabled && setActive('ai-fix')}
          title={aiEnabled ? undefined : t('tab.aiFixDisabledTooltip')}
          style={{
            padding: '4px 10px',
            fontSize: 12,
            fontWeight: 600,
            background:
              active === 'ai-fix' ? 'var(--accent)' : 'var(--accent-soft)',
            color: active === 'ai-fix' ? '#FFFFFF' : 'var(--accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: aiEnabled ? 'pointer' : 'not-allowed',
            opacity: aiEnabled ? 1 : 0.45,
          }}
        >
          ✨ {t('tab.aiFix')}
        </button>
      )}
    </div>
  );
}
