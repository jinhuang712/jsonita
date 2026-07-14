import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { useEditorStore } from '../store/editor';
import { settings as settingsApi } from '../ipc/commands';
import { useSettingsStore } from '../store/settings';
import { useUiStore, type Pane } from '../store/ui';
import { formatAccelerator } from '../keyboard/accelerators';
import {
  FormatIcon,
  GearIcon,
  HistoryIcon,
  JsonBracesIcon,
  MinifyIcon,
  SplitPanelIcon,
  SparklesIcon,
  ToStringIcon,
  TreeIcon,
  type IconProps,
} from '../components/icons';
import logoMarkUrl from '../../assets/icons/menubar/jsonita-menubar-template-22@3x.png';

/**
 * 顶部 5 个功能 Tab + AI Fix 提示 + 右上设置入口。
 *
 * 视觉锚：design/01_mockups.md § 1.1-1.5
 * Spec ref: design/04_components.md § 4.1 TabBar
 */

const TABS: { id: Pane; key: string; Icon: (props: IconProps) => JSX.Element }[] = [
  { id: 'format', key: 'format', Icon: FormatIcon },
  { id: 'minify', key: 'minify', Icon: MinifyIcon },
  { id: 'tree', key: 'tree', Icon: TreeIcon },
  { id: 'json-to-str', key: 'jsonToStr', Icon: ToStringIcon },
  { id: 'str-to-json', key: 'strToJson', Icon: JsonBracesIcon },
];

type ChromeActionTooltip = {
  label: string;
  shortcut: string;
};

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

  const toggleSinglePaneMode = () => {
    settingsApi
      .set({ singlePaneMode: !settings.singlePaneMode })
      .then(setSettings)
      .catch(() => {});
  };

  return (
    <div
      onMouseDown={startDragging}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        minHeight: 44,
        padding: '7px 10px 8px',
        background: 'color-mix(in srgb, var(--surface-quiet) 28%, transparent)',
        borderBottom: '1px solid var(--border)',
        cursor: 'grab',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 22,
          height: 22,
          flex: '0 0 auto',
          marginRight: 6,
          pointerEvents: 'none',
          display: 'inline-block',
          backgroundColor: 'var(--text)',
          opacity: 0.82,
          WebkitMaskImage: `url(${logoMarkUrl})`,
          maskImage: `url(${logoMarkUrl})`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
      <div
        role="tablist"
        aria-label="Pane tabs"
        ref={tabListRef}
        style={{ display: 'flex', alignItems: 'center', gap: 5, position: 'relative' }}
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
              <Icon className="jsonita-tab-button-icon" width={13} height={13} strokeWidth={2} aria-hidden="true" />
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
          className="jsonita-ai-fix-entry"
          onClick={() => undefined}
          title={t('tab.aiFixDisabledTooltip')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '4px 10px',
            fontSize: 'var(--fs-sm)',
            lineHeight: 'var(--lh-tight)',
            fontWeight: 580,
            fontFamily: 'var(--font-ui)',
            background: 'var(--accent-soft)',
            color: 'var(--accent)',
            border: '1px solid color-mix(in srgb, var(--accent) 24%, transparent)',
            borderRadius: 'var(--radius-sm)',
            cursor: 'not-allowed',
            opacity: 0.55,
            transition:
              'opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out)',
          }}
        >
          <SparklesIcon width={13} height={13} strokeWidth={2} aria-hidden="true" />
          {t('tab.aiFix')}
        </button>
      )}
      <div className="jsonita-chrome-actions" aria-label={tShell('actions.windowActions')}>
        <ChromeActionButton
          onClick={toggleSinglePaneMode}
          aria-label={
            settings.singlePaneMode
              ? tShell('actions.switchToSplitPanel')
              : tShell('actions.switchToSinglePanel')
          }
          tooltipLabel={tShell('actions.splitPanel')}
          tooltipShortcut={formatAccelerator(settings.shortcutSplitToggle)}
        >
          <SplitPanelIcon width={15} height={15} strokeWidth={1.8} aria-hidden="true" />
        </ChromeActionButton>
        <ChromeActionButton
          onClick={() => {
            setSettingsViewOpen(false);
            setHistoryModalOpen(true);
          }}
          aria-label={tShell('actions.openHistory')}
          tooltipLabel={tShell('actions.history')}
          tooltipShortcut={formatAccelerator('CmdOrCtrl+Y')}
        >
          <HistoryIcon width={15} height={15} strokeWidth={1.8} aria-hidden="true" />
        </ChromeActionButton>
        <ChromeActionButton
          onClick={() => {
            setHistoryModalOpen(false);
            setSettingsViewOpen(true);
          }}
          aria-label={tShell('actions.openSettings')}
          tooltipLabel={tShell('actions.settings')}
          tooltipShortcut={formatAccelerator('CmdOrCtrl+,')}
        >
          <GearIcon width={15} height={15} strokeWidth={1.75} aria-hidden="true" />
        </ChromeActionButton>
      </div>
    </div>
  );
}

function ChromeActionButton({
  children,
  onClick,
  tooltipLabel,
  tooltipShortcut,
  ...buttonProps
}: PropsWithChildren<
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type' | 'title'> & {
    tooltipLabel: ChromeActionTooltip['label'];
    tooltipShortcut: ChromeActionTooltip['shortcut'];
  }
>) {
  const tooltipId = useId();

  return (
    <button
      {...buttonProps}
      type="button"
      className="jsonita-chrome-icon-button"
      onClick={onClick}
      aria-describedby={tooltipId}
    >
      {children}
      <span id={tooltipId} role="tooltip" className="jsonita-chrome-tooltip">
        <span className="jsonita-chrome-tooltip-label">{tooltipLabel}</span>
        <kbd className="jsonita-chrome-tooltip-shortcut">{tooltipShortcut}</kbd>
      </span>
    </button>
  );
}
