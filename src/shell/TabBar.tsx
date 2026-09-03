import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEditorStore } from '../store/editor';
import { settings as settingsApi } from '../ipc/commands';
import { useAiStore } from '../store/ai';
import { useSettingsStore } from '../store/settings';
import { useUiStore, type Pane } from '../store/ui';
import { ChromeIconButton } from '../components/ChromeIconButton';
import {
  FormatIcon,
  GearIcon,
  HistoryIcon,
  MinifyIcon,
  SinglePanelIcon,
  SplitPanelIcon,
  SparklesIcon,
  ToStringIcon,
  TreeIcon,
  type IconProps,
} from '../components/icons';
import logoMarkUrl from '../../assets/icons/menubar/jsonita-menubar-template-22@3x.png';

/**
 * 顶部 chrome：品牌标记 + 4 个功能 Tab + AI Fix 入口 + 右侧窗口动作。
 *
 * 视觉锚：design/screens.md § Editor Workspace
 * 样式统一在 global.css § 3；此处只保留几何测量与行为。
 */

const TABS: { id: Pane; key: string; Icon: (props: IconProps) => JSX.Element }[] = [
  { id: 'format', key: 'format', Icon: FormatIcon },
  { id: 'minify', key: 'minify', Icon: MinifyIcon },
  { id: 'tree', key: 'tree', Icon: TreeIcon },
  { id: 'json-to-str', key: 'jsonToStr', Icon: ToStringIcon },
];

export function TabBar() {
  const { t } = useTranslation('panes');
  const { t: tShell } = useTranslation('shell');
  const active = useUiStore((s) => s.activePane);
  const showAiFix = useUiStore((s) => s.showAiFix);
  const setActive = useUiStore((s) => s.setActivePane);
  const setHistoryModalOpen = useUiStore((s) => s.setHistoryModalOpen);
  const setSettingsViewOpen = useUiStore((s) => s.setSettingsViewOpen);
  const settings = useSettingsStore((s) => s.settings);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const aiEnabled = useSettingsStore((s) => s.settings.aiEnabled);
  const aiStatus = useAiStore((s) => s.status);
  const retryAi = useAiStore((s) => s.retry);
  const editorStatus = useEditorStore((s) => s.status);
  // 有 parse error 且 showAiFix 时露出 AI Fix 入口：AI 开启可点击，未开启灰显 + 引导 tooltip。
  const showAiFixEntry = showAiFix && editorStatus === 'error';
  const aiFixDisabled = !aiEnabled;
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
  }, [measureActiveTab, t, showAiFixEntry]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measureActiveTab());
    if (tabListRef.current) observer.observe(tabListRef.current);
    Object.values(tabRefs.current).forEach((tab) => {
      if (tab) observer.observe(tab);
    });
    return () => observer.disconnect();
  }, [measureActiveTab, showAiFixEntry]);

  const startDragging = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button')) return;
    getCurrentWindow().startDragging().catch(() => {});
  };

  const toggleSinglePaneMode = () => {
    settingsApi
      .set({ singlePaneMode: !settings.singlePaneMode })
      .then(setSettings)
      .catch(() => {});
  };

  return (
    <div className="jsonita-tabbar" onMouseDown={startDragging}>
      <span
        aria-hidden="true"
        className="jsonita-brand-mark"
        style={{
          width: 22,
          height: 22,
          marginRight: 6,
          WebkitMaskImage: `url(${logoMarkUrl})`,
          maskImage: `url(${logoMarkUrl})`,
        }}
      />
      <div role="tablist" aria-label="Pane tabs" ref={tabListRef} className="jsonita-tablist">
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
          const { Icon } = tab;
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
              className={
                isActive
                  ? 'jsonita-tab-button jsonita-tab-button-active'
                  : 'jsonita-tab-button'
              }
            >
              <Icon className="jsonita-tab-button-icon" width={13} height={13} strokeWidth={1.9} aria-hidden="true" />
              {t(`tab.${tab.key}` as 'tab.format')}
            </button>
          );
        })}
      </div>
      <div className="jsonita-tabbar-spacer" />
      {showAiFixEntry && (
        <button
          type="button"
          aria-disabled={aiFixDisabled ? 'true' : undefined}
          aria-pressed={!aiFixDisabled && active === 'ai-fix' ? 'true' : undefined}
          tabIndex={aiFixDisabled ? -1 : 0}
          className="jsonita-ai-fix-entry"
          onClick={
            aiFixDisabled
              ? () => undefined
              : () => {
                  if (aiStatus !== 'requesting' && aiStatus !== 'awaiting-decision') retryAi();
                  setActive('ai-fix');
                }
          }
          title={aiFixDisabled ? t('tab.aiFixDisabledTooltip') : t('tab.aiFix')}
        >
          <SparklesIcon width={13} height={13} strokeWidth={1.9} aria-hidden="true" />
          {t('tab.aiFix')}
        </button>
      )}
      <div className="jsonita-chrome-actions" aria-label={tShell('actions.windowActions')}>
        <ChromeIconButton
          onClick={toggleSinglePaneMode}
          aria-label={
            settings.singlePaneMode
              ? tShell('actions.switchToSplitPanel')
              : tShell('actions.switchToSinglePanel')
          }
          tooltipLabel={
            settings.singlePaneMode
              ? tShell('actions.switchToSplitPanel')
              : tShell('actions.switchToSinglePanel')
          }
          tooltipShortcut={settings.shortcutSplitToggle}
        >
          {settings.singlePaneMode ? (
            <SinglePanelIcon width={15} height={15} strokeWidth={1.7} aria-hidden="true" />
          ) : (
            <SplitPanelIcon width={15} height={15} strokeWidth={1.7} aria-hidden="true" />
          )}
        </ChromeIconButton>
        <ChromeIconButton
          onClick={() => {
            setSettingsViewOpen(false);
            setHistoryModalOpen(true);
          }}
          aria-label={tShell('actions.openHistory')}
          tooltipLabel={tShell('actions.history')}
          tooltipShortcut="CmdOrCtrl+Y"
        >
          <HistoryIcon width={15} height={15} strokeWidth={1.7} aria-hidden="true" />
        </ChromeIconButton>
        <ChromeIconButton
          onClick={() => {
            setHistoryModalOpen(false);
            setSettingsViewOpen(true);
          }}
          aria-label={tShell('actions.openSettings')}
          tooltipLabel={tShell('actions.settings')}
          tooltipShortcut="CmdOrCtrl+,"
        >
          <GearIcon width={15} height={15} strokeWidth={1.7} aria-hidden="true" />
        </ChromeIconButton>
      </div>
    </div>
  );
}
