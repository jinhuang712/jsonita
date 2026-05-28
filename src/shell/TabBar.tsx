import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEditorStore } from '../store/editor';
import { useSettingsStore } from '../store/settings';
import { useUiStore, type Pane } from '../store/ui';
import { formatAccelerator } from '../keyboard/accelerators';

/**
 * 顶部 5 个功能 Tab + AI Fix 提示 + 右上设置入口。
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
  const { t: tShell } = useTranslation('shell');
  const active = useUiStore((s) => s.activePane);
  const showAiFix = useUiStore((s) => s.showAiFix);
  const setActive = useUiStore((s) => s.setActivePane);
  const setSettingsModalOpen = useUiStore((s) => s.setSettingsModalOpen);
  const aiEnabled = useSettingsStore((s) => s.settings.aiEnabled);
  const editorStatus = useEditorStore((s) => s.status);
  const showAiFixPrompt = showAiFix && editorStatus === 'error' && !aiEnabled;
  const tabListRef = useRef<HTMLDivElement | null>(null);
  const tabRefs = useRef<Partial<Record<Pane, HTMLButtonElement | null>>>({});
  const [activeRect, setActiveRect] = useState<{ left: number; width: number } | null>(null);

  const measureActiveTab = useCallback(() => {
    const container = tabListRef.current;
    const activeTab = tabRefs.current[active];
    if (!container || !activeTab) {
      setActiveRect(null);
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();
    const next = {
      left: tabRect.left - containerRect.left,
      width: tabRect.width,
    };

    setActiveRect((prev) => {
      if (
        prev &&
        Math.abs(prev.left - next.left) < 0.5 &&
        Math.abs(prev.width - next.width) < 0.5
      ) {
        return prev;
      }
      return next;
    });
  }, [active]);

  useLayoutEffect(() => {
    measureActiveTab();
  }, [measureActiveTab, t, showAiFixPrompt]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measureActiveTab());
    if (tabListRef.current) observer.observe(tabListRef.current);
    Object.values(tabRefs.current).forEach((tab) => {
      if (tab) observer.observe(tab);
    });
    return () => observer.disconnect();
  }, [measureActiveTab, showAiFixPrompt]);

  const startDragging = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    getCurrentWindow().startDragging().catch(() => {});
  };

  return (
    <div
      onMouseDown={startDragging}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px',
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        cursor: 'grab',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        role="tablist"
        aria-label="Pane tabs"
        ref={tabListRef}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          position: 'relative',
        }}
      >
        {activeRect && (
          <span
            aria-hidden="true"
            className="jsonita-tab-active-pill"
            style={{
              width: activeRect.width,
              transform: `translateX(${activeRect.left}px)`,
            }}
          />
        )}
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              ref={(node) => {
                tabRefs.current[tab.id] = node;
              }}
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={isActive ? 'jsonita-tab-button jsonita-tab-button-active' : 'jsonita-tab-button'}
            >
              {t(`tab.${tab.key}` as 'tab.format')}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }} />
      {showAiFixPrompt && (
        <button
          aria-disabled="true"
          tabIndex={-1}
          onClick={() => undefined}
          title={t('tab.aiFixDisabledTooltip')}
          style={{
            padding: '4px 10px',
            fontSize: 'var(--fs-sm)',
            lineHeight: 'var(--lh-tight)',
            fontWeight: 600,
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            cursor: 'not-allowed',
            opacity: 0.55,
            transition:
              'opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
          }}
        >
          ✨ {t('tab.aiFix')}
        </button>
      )}
      <button
        type="button"
        className="jsonita-chrome-icon-button"
        onClick={() => setSettingsModalOpen(true)}
        aria-label={tShell('actions.openSettings')}
        title={`${tShell('actions.openSettings')} (${formatAccelerator('CmdOrCtrl+,')})`}
      >
        ⚙
      </button>
    </div>
  );
}
