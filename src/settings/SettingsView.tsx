import { useEffect, useRef, useState } from 'react';
import { getVersion } from '@tauri-apps/api/app';
import { useTranslation } from 'react-i18next';
import { settings as settingsApi, system as systemApi } from '../ipc/commands';
import { useSettingsStore, type Settings } from '../store/settings';
import { useUiStore } from '../store/ui';
import { formatAccelerator } from '../keyboard/accelerators';
import { ShortcutGlyph } from '../components/ShortcutGlyph';
import { ActionButton } from '../components/ActionButton';
import { CloseIcon } from '../components/icons';
import { ApiKeyInput } from './ApiKeyInput';
import { ShortcutInput } from './ShortcutInput';
import {
  clampSettingsScrollTarget,
  resolveSettingsActiveGroup,
  shouldReleaseSettingsScrollLock,
} from './settingsScrollSpy';

/**
 * 设置页 — 左侧目录 + 右侧连续滚动的分组列表。
 *
 * 控件语言（global.css § 6）：
 *   - 每组一个安静容器 `.jsonita-settings-group`，行间发丝线，不再用彩色区块。
 *   - 布尔项统一为开关 `.jsonita-switch`；枚举项用分段控件；文本 / 快捷键用单边框输入。
 *   - 即时生效：onChange 立即 settings_set。
 *
 * Spec ref: design/screens.md § Settings and History
 */

type Group = 'general' | 'appearance' | 'shortcuts' | 'ai' | 'history' | 'jsonTransform' | 'about';

const GROUPS: Group[] = ['general', 'appearance', 'ai', 'history', 'jsonTransform', 'shortcuts', 'about'];

const NAV_ICONS: Record<Group, React.ReactNode> = {
  general: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 14.2a8 8 0 0 0 .1-1.2 8 8 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-2.1-1.2L14.6 4h-5.2l-.4 2.6a7.8 7.8 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 4.4 13a8 8 0 0 0 .1 1.2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 2.1 1.2l.4 2.6h5.2l.4-2.6a7.8 7.8 0 0 0 2.1-1.2l2.4 1 2-3.5-2.1-1.5Z" /></svg>
  ),
  appearance: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 0 0 18Z" fill="currentColor" stroke="none" /></svg>
  ),
  shortcuts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="11" rx="2.5" /><path d="M7 7V5.5M11 7V5.5M15 7V5.5M19 7V5.5" /></svg>
  ),
  ai: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /><circle cx="12" cy="12" r="3.5" /></svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /><path d="M12 8v4l3 2" /></svg>
  ),
  jsonTransform: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><path d="M7 8a3 3 0 0 0-3 3v2a3 3 0 0 1-3 3 3 3 0 0 0 3 3" /><path d="M17 8a3 3 0 0 1 3 3v2a3 3 0 0 0 3 3 3 3 0 0 1-3 3" /></svg>
  ),
  about: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></svg>
  ),
};

export function SettingsView() {
  const { t } = useTranslation('settings');
  const open = useUiStore((s) => s.settingsViewOpen);
  const setOpen = useUiStore((s) => s.setSettingsViewOpen);
  const settings = useSettingsStore((s) => s.settings);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const [activeGroup, setActiveGroup] = useState<Group>('general');
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const programmaticScrollRef = useRef<{ group: Group; targetTop: number } | null>(null);
  const sectionRefs = useRef<Record<Group, HTMLElement | null>>({
    general: null,
    appearance: null,
    shortcuts: null,
    ai: null,
    history: null,
    jsonTransform: null,
    about: null,
  });

  // 页面打开时拉一次 settings
  useEffect(() => {
    if (!open) return;
    settingsApi
      .getAll()
      .then(setSettings)
      .catch(() => {});
  }, [open, setSettings]);

  const patch = async (p: Partial<Settings>) => {
    try {
      const updated = await settingsApi.set(p);
      setSettings(updated);
    } catch {
      /* ignore */
    }
  };

  const scrollToGroup = (group: Group) => {
    const scrollEl = scrollRef.current;
    const target = sectionRefs.current[group];
    if (!scrollEl || !target) return;
    const scrollRect = scrollEl.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = clampSettingsScrollTarget(
      scrollEl.scrollTop + targetRect.top - scrollRect.top - 8,
      scrollEl.scrollHeight - scrollEl.clientHeight,
    );
    programmaticScrollRef.current = { group, targetTop };
    scrollEl.scrollTo({
      top: targetTop,
      behavior: 'smooth',
    });
    setActiveGroup(group);
  };

  useEffect(() => {
    const scrollEl = scrollRef.current;
    if (!scrollEl) return;

    const updateActiveGroup = () => {
      const lock = programmaticScrollRef.current;
      if (lock) {
        setActiveGroup((current) =>
          current === lock.group ? current : lock.group,
        );
        if (shouldReleaseSettingsScrollLock(scrollEl.scrollTop, lock.targetTop)) {
          programmaticScrollRef.current = null;
        }
        return;
      }

      if (scrollEl.scrollTop + scrollEl.clientHeight >= scrollEl.scrollHeight - 8) {
        setActiveGroup((current) =>
          current === GROUPS[GROUPS.length - 1] ? current : GROUPS[GROUPS.length - 1],
        );
        return;
      }

      const top = scrollEl.scrollTop + 24;
      let next = GROUPS[0];
      for (const group of GROUPS) {
        const section = sectionRefs.current[group];
        if (section && section.offsetTop <= top) {
          next = group;
        }
      }
      const resolved = resolveSettingsActiveGroup(next, programmaticScrollRef.current?.group ?? null);
      setActiveGroup((current) => (current === resolved ? current : resolved));
    };

    updateActiveGroup();
    scrollEl.addEventListener('scroll', updateActiveGroup, { passive: true });
    return () => scrollEl.removeEventListener('scroll', updateActiveGroup);
  }, []);

  return (
    <div
      aria-labelledby="settings-page-title"
      className="jsonita-page jsonita-settings-page"
    >
      <div className="jsonita-page-header">
        <div id="settings-page-title" className="jsonita-page-title">
          {t('title')}
        </div>
        <button
          type="button"
          className="jsonita-page-close"
          onClick={() => setOpen(false)}
          aria-label={t('actions.close')}
          title={t('actions.close')}
        >
          <ShortcutGlyph accelerator="Escape" decorative />
          <CloseIcon width={15} height={15} strokeWidth={1.85} aria-hidden="true" />
        </button>
      </div>
      <div className="jsonita-page-body">
        <nav className="jsonita-settings-nav">
          <div className="jsonita-settings-nav-list">
            {GROUPS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => scrollToGroup(g)}
                aria-current={activeGroup === g ? 'page' : undefined}
                className="jsonita-settings-nav-btn"
                data-active={activeGroup === g ? 'true' : undefined}
              >
                <span className="jsonita-settings-nav-icon">{NAV_ICONS[g]}</span>
                {t(`groups.${g}` as 'groups.general')}
              </button>
            ))}
          </div>
          <div className="jsonita-settings-nav-footer">
            <button
              type="button"
              className="jsonita-settings-reset-btn"
              onClick={async () => {
                const u = await settingsApi.reset();
                setSettings(u);
              }}
            >
              <span className="jsonita-settings-nav-icon" aria-hidden="true">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 12a9 9 0 1 0 3-6.7" />
                  <path d="M3 4v5h5" />
                </svg>
              </span>
              {t('footer.resetAll')}
            </button>
          </div>
        </nav>
        <div className="jsonita-settings-scroll" ref={scrollRef}>
          <SettingsSection group="general" title={t('groups.general')} sectionRefs={sectionRefs}>
            <GroupGeneral settings={settings} patch={patch} />
          </SettingsSection>
          <SettingsSection group="appearance" title={t('groups.appearance')} sectionRefs={sectionRefs}>
            <GroupAppearance settings={settings} patch={patch} />
          </SettingsSection>
          <SettingsSection
            group="ai"
            title={t('groups.ai')}
            sectionRefs={sectionRefs}
            headerAction={
              <Switch
                checked={settings.aiEnabled}
                onChange={(v) => patch({ aiEnabled: v })}
                ariaLabel={t('ai.enabled')}
              />
            }
          >
            <GroupAi settings={settings} patch={patch} />
          </SettingsSection>
          <SettingsSection group="history" title={t('groups.history')} sectionRefs={sectionRefs}>
            <GroupHistory settings={settings} patch={patch} />
          </SettingsSection>
          <SettingsSection group="jsonTransform" title={t('groups.jsonTransform')} sectionRefs={sectionRefs}>
            <GroupJsonTransform settings={settings} patch={patch} />
          </SettingsSection>
          <SettingsSection group="shortcuts" title={t('groups.shortcuts')} sectionRefs={sectionRefs}>
            <GroupShortcuts settings={settings} patch={patch} />
          </SettingsSection>
          <SettingsSection group="about" title={t('groups.about')} sectionRefs={sectionRefs}>
            <GroupAbout />
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

interface GroupProps {
  settings: Settings;
  patch: (p: Partial<Settings>) => void | Promise<void>;
}

function SettingsSection({
  group,
  title,
  sectionRefs,
  headerAction,
  children,
}: {
  group: Group;
  title: string;
  sectionRefs: React.MutableRefObject<Record<Group, HTMLElement | null>>;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="jsonita-settings-section"
      data-settings-group={group}
      ref={(node) => {
        sectionRefs.current[group] = node;
      }}
      aria-labelledby={`settings-section-${group}`}
    >
      <div className="jsonita-settings-section-header">
        <h2 id={`settings-section-${group}`} className="jsonita-settings-section-title">
          {title}
        </h2>
        {headerAction}
      </div>
      {children}
    </section>
  );
}

/* ── 行级构件 ───────────────────────────────────────── */

function SettingsGroup({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={className ? `jsonita-settings-group ${className}` : 'jsonita-settings-group'}>
      {children}
    </div>
  );
}

function Row({
  label,
  hint,
  children,
  muted,
}: {
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className={muted ? 'jsonita-settings-row jsonita-settings-row-muted' : 'jsonita-settings-row'}>
      <div className="jsonita-settings-row-label">
        {label}
        {hint && <div className="jsonita-settings-row-hint">{hint}</div>}
      </div>
      <div className="jsonita-settings-row-control">{children}</div>
    </div>
  );
}

function ToggleRow({
  label,
  hint,
  on,
  onChange,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="jsonita-settings-row jsonita-settings-row-toggle">
      <span className="jsonita-settings-row-label">
        {label}
        {hint && <span className="jsonita-settings-row-hint">{hint}</span>}
      </span>
      <span className="jsonita-settings-row-control">
        <Switch checked={on} onChange={onChange} />
      </span>
    </label>
  );
}

function Switch({
  checked,
  onChange,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}) {
  return (
    <span className="jsonita-switch">
      <input
        type="checkbox"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="jsonita-switch-input"
      />
      <span
        aria-hidden="true"
        className="jsonita-switch-track"
        style={{
          background: checked ? 'var(--toggle-on)' : 'transparent',
          borderColor: checked ? 'transparent' : undefined,
        }}
      />
    </span>
  );
}

function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="jsonita-segmented" role="group" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          aria-pressed={value === opt.value}
          onClick={() => {
            if (opt.value !== value) onChange(opt.value);
          }}
          className="jsonita-segmented-option"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

/* ── 分组 ───────────────────────────────────────────── */

function GroupGeneral({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <SettingsGroup>
      <ToggleRow
        label={t('general.launchAtLogin')}
        on={settings.launchAtLogin}
        onChange={(v) => patch({ launchAtLogin: v })}
      />
      <ToggleRow
        label={t('general.hideOnBlur')}
        on={settings.hideOnBlur}
        onChange={(v) => patch({ hideOnBlur: v })}
      />
    </SettingsGroup>
  );
}

function GroupAppearance({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <>
      <SettingsGroup>
        <Row label={t('appearance.language')}>
          <SegmentedControl
            ariaLabel={t('appearance.language')}
            value={settings.locale}
            options={[
              { value: 'en-US', label: 'English' },
              { value: 'zh-CN', label: '中文' },
            ]}
            onChange={(v) => patch({ locale: v })}
          />
        </Row>
        <Row label={t('appearance.theme')}>
          <SegmentedControl
            ariaLabel={t('appearance.theme')}
            value={settings.theme}
            options={[
              { value: 'system', label: 'System' },
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
            ]}
            onChange={(v) => patch({ theme: v })}
          />
        </Row>
      </SettingsGroup>
      <SettingsGroup>
        <ToggleRow
          label={t('appearance.smartWidth')}
          on={settings.smartWidth}
          onChange={(v) => patch({ smartWidth: v })}
        />
        <ToggleRow
          label={t('appearance.singlePaneMode')}
          on={settings.singlePaneMode}
          onChange={(v) => patch({ singlePaneMode: v })}
        />
        <ToggleRow
          label={t('appearance.editorSoftWrap')}
          on={settings.editorSoftWrap}
          onChange={(v) => patch({ editorSoftWrap: v })}
        />
      </SettingsGroup>
    </>
  );
}

function GroupAi({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  const disabled = !settings.aiEnabled;
  return (
    <div aria-disabled={disabled} className={disabled ? 'jsonita-settings-disabled' : undefined}>
      <SettingsGroup>
        <Row label={t('ai.model')} hint={t('ai.sectionHint')}>
          <span style={{ fontFamily: 'var(--font-mono-ui)', fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            openrouter/free
          </span>
        </Row>
        <ApiKeyInput settings={settings} patch={patch} />
      </SettingsGroup>
    </div>
  );
}

function GroupHistory({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <SettingsGroup>
      <ToggleRow
        label={t('history.enabled')}
        on={settings.historyEnabled}
        onChange={(v) => patch({ historyEnabled: v })}
      />
      <Row label={t('history.limit')}>
        <SegmentedControl
          ariaLabel={t('history.limit')}
          value={settings.historyLimit}
          options={[
            { value: 10, label: '10' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
            { value: 200, label: '200' },
          ]}
          onChange={(v) => patch({ historyLimit: v })}
        />
      </Row>
    </SettingsGroup>
  );
}

function GroupJsonTransform({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <SettingsGroup>
      <ToggleRow
        label={t('jsonTransform.alwaysStringToJson')}
        on={settings.alwaysStringToJson}
        onChange={(v) => patch({ alwaysStringToJson: v })}
      />
      <ToggleRow
        label={t('jsonTransform.autoUnwrap')}
        on={settings.autoUnwrap}
        onChange={(v) => patch({ autoUnwrap: v })}
      />
      <Row label={t('jsonTransform.unwrapTimeoutMs')}>
        <input
          type="number"
          value={settings.unwrapTimeoutMs}
          onChange={(e) =>
            patch({ unwrapTimeoutMs: Number(e.target.value) || 200 })
          }
          className="jsonita-input jsonita-input-mono"
          style={{ width: 84, textAlign: 'right' }}
          aria-label={t('jsonTransform.unwrapTimeoutMs')}
        />
      </Row>
    </SettingsGroup>
  );
}

function GroupShortcuts({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  const reservedExamples = [
    formatAccelerator('CmdOrCtrl+Q'),
    formatAccelerator('CmdOrCtrl+W'),
    formatAccelerator('CmdOrCtrl+Tab'),
  ].join(' / ');
  const builtInShortcuts = [
    { label: t('shortcuts.builtIn.switchTabs'), keys: ['Tab', 'Shift+Tab'] },
    { label: t('shortcuts.builtIn.exitEditing'), keys: ['Escape'] },
    { label: t('shortcuts.builtIn.hideWindow'), keys: ['Escape', 'Escape'] },
    { label: t('shortcuts.builtIn.runCurrent'), keys: ['CmdOrCtrl+Enter'] },
    { label: t('shortcuts.builtIn.aiFixCancel'), keys: ['Escape'] },
    { label: t('shortcuts.builtIn.history'), keys: ['CmdOrCtrl+Y'] },
    { label: t('shortcuts.builtIn.settings'), keys: ['CmdOrCtrl+,'] },
    { label: t('shortcuts.builtIn.clearInput'), keys: ['CmdOrCtrl+K'] },
    { label: t('shortcuts.builtIn.zoom'), keys: ['CmdOrCtrl+Plus', 'CmdOrCtrl+Minus', 'CmdOrCtrl+0'] },
  ];

  return (
    <>
      <SettingsGroup>
        <Row label={t('shortcuts.toggle')}>
          <ShortcutInput
            action="toggle-window"
            value={settings.shortcutToggle}
            onChange={(v) => patch({ shortcutToggle: v })}
          />
        </Row>
        <Row label={t('shortcuts.splitToggle')}>
          <ShortcutInput
            ariaLabel={t('shortcuts.splitToggle')}
            value={settings.shortcutSplitToggle}
            onChange={(v) => patch({ shortcutSplitToggle: v })}
          />
        </Row>
      </SettingsGroup>
      <SettingsGroup>
        {builtInShortcuts.map((shortcut) => (
          <Row key={shortcut.label} label={shortcut.label} muted>
            <span className="jsonita-settings-key-group">
              {shortcut.keys.map((accelerator, index) => (
                <ShortcutGlyph key={`${accelerator}-${index}`} accelerator={accelerator} />
              ))}
            </span>
          </Row>
        ))}
      </SettingsGroup>
      <div className="jsonita-settings-note">{t('shortcuts.hint', { reserved: reservedExamples })}</div>
    </>
  );
}

function GroupAbout() {
  const { t } = useTranslation('settings');
  const [version, setVersion] = useState('');
  useEffect(() => {
    getVersion().then(setVersion).catch(() => setVersion(''));
  }, []);

  return (
    <div className="jsonita-about">
      <div className="jsonita-about-head">
        <div>
          <div className="jsonita-about-name">Jsonita</div>
          <div className="jsonita-about-tagline">Tiny menu-bar JSON toolkit</div>
        </div>
        <ActionButton variant="secondary" onClick={() => systemApi.openGithub().catch(() => {})}>
          GitHub
        </ActionButton>
      </div>
      <SettingsGroup className="jsonita-about-meta">
        <AboutMeta label={t('about.version')} value={version || '—'} />
        <AboutMeta label={t('about.license')} value="MIT" />
        <AboutMeta label={t('about.author')} value="Jin Huang" />
      </SettingsGroup>
      <SettingsGroup>
        <Row label="Data">
          <span className="jsonita-about-path">~/Library/Application Support/Jsonita/</span>
        </Row>
        <Row label="Logs">
          <span className="jsonita-about-path">~/Library/Logs/Jsonita/</span>
        </Row>
      </SettingsGroup>
    </div>
  );
}

function AboutMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="jsonita-about-meta-label">{label}</span>
      <span className="jsonita-about-meta-value">{value}</span>
    </div>
  );
}
