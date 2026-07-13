import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settings as settingsApi, system as systemApi } from '../ipc/commands';
import { on } from '../ipc/events';
import { useSettingsStore, type Settings } from '../store/settings';
import { useUiStore } from '../store/ui';
import { formatAccelerator } from '../keyboard/accelerators';
import { CloseIcon } from '../components/icons';
import { ApiKeyInput } from './ApiKeyInput';
import { ShortcutInput } from './ShortcutInput';
import {
  clampSettingsScrollTarget,
  resolveSettingsActiveGroup,
  shouldReleaseSettingsScrollLock,
} from './settingsScrollSpy';

/**
 * 设置页 — 左侧目录索引 + 右侧连续滚动配置文档。
 *
 * 视觉锚：design/jsonita-settings-detail.md
 * Spec ref: design/04 § 4.6 SettingsView
 * M2-N1 minimal：General + AI + JSON Transform + History 4 组（Shortcuts M2-N5；About M3）；
 * 字段：launchAtLogin / hideOnBlur / autoUnwrap / aiEnabled / historyLimit / smartWidth / editorSoftWrap。
 * 即时生效：onChange 立即 settings_set。
 */

type Group = 'general' | 'shortcuts' | 'ai' | 'history' | 'jsonTransform' | 'about';

const GROUPS: Group[] = ['general', 'shortcuts', 'ai', 'history', 'jsonTransform', 'about'];

const NAV_ICONS: Record<Group, React.ReactNode> = {
  general: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 14.2a8 8 0 0 0 .1-1.2 8 8 0 0 0-.1-1.2l2-1.5-2-3.5-2.4 1a7.8 7.8 0 0 0-2.1-1.2L14.6 4h-5.2l-.4 2.6a7.8 7.8 0 0 0-2.1 1.2l-2.4-1-2 3.5 2 1.5A8 8 0 0 0 4.4 13a8 8 0 0 0 .1 1.2l-2 1.5 2 3.5 2.4-1a7.8 7.8 0 0 0 2.1 1.2l.4 2.6h5.2l.4-2.6a7.8 7.8 0 0 0 2.1-1.2l2.4 1 2-3.5-2.1-1.5Z" /></svg>
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
    shortcuts: null,
    ai: null,
    history: null,
    jsonTransform: null,
    about: null,
  });

  // 启动 + Modal 打开时拉 settings
  useEffect(() => {
    if (!open) return;
    settingsApi
      .getAll()
      .then(setSettings)
      .catch(() => {});
  }, [open, setSettings]);

  // 监听 settings:changed event（其他窗口 patch 后同步）
  useEffect(() => {
    let unlisten: (() => void) | null = null;
    on('settings:changed', (payload) => {
      setSettings(payload);
    }).then((fn) => {
      unlisten = fn;
    });
    return () => {
      unlisten?.();
    };
  }, [setSettings]);

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
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--glass-bg)',
        color: 'var(--text)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div
            id="settings-page-title"
            style={{
              fontFamily: 'var(--font-ui)',
              fontSize: '20px',
              fontWeight: 600,
              letterSpacing: '-0.01em',
              lineHeight: 1.15,
            }}
          >
            {t('title')}
          </div>
          <button
            type="button"
            className="jsonita-page-close"
            onClick={() => setOpen(false)}
            aria-label={t('actions.close')}
            title={t('actions.close')}
          >
            <kbd aria-hidden="true">Esc</kbd>
            <CloseIcon width={15} height={15} strokeWidth={1.85} aria-hidden="true" />
          </button>
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <nav
            style={{
              width: 170,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-elevated-nav)',
              padding: 'var(--sp-3) var(--sp-2)',
            }}
          >
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => scrollToGroup(g)}
                aria-current={activeGroup === g ? 'page' : undefined}
                className="jsonita-settings-nav-btn"
                data-active={activeGroup === g ? 'true' : undefined}
              >
                <span className="jsonita-settings-nav-icon">{NAV_ICONS[g]}</span>
                {t(`groups.${g}` as 'groups.general')}
              </button>
            ))}
          </nav>
          <div
            className="jsonita-settings-scroll"
            ref={scrollRef}
            style={{
              flex: 1,
              padding: 'var(--sp-5) var(--sp-5) var(--sp-6)',
              overflow: 'auto',
              fontSize: 'var(--fs-md)',
              position: 'relative',
              scrollBehavior: 'smooth',
            }}
          >
            <SettingsSection
              group="general"
              title={t('groups.general')}
              sectionRefs={sectionRefs}
            >
              <GroupGeneral settings={settings} patch={patch} />
            </SettingsSection>
            <SettingsSection
              group="shortcuts"
              title={t('groups.shortcuts')}
              sectionRefs={sectionRefs}
            >
              <GroupShortcuts settings={settings} patch={patch} />
            </SettingsSection>
            <SettingsSection
              group="ai"
              title={t('groups.ai')}
              sectionRefs={sectionRefs}
            >
              <GroupAi settings={settings} patch={patch} />
            </SettingsSection>
            <SettingsSection
              group="history"
              title={t('groups.history')}
              sectionRefs={sectionRefs}
            >
              <GroupHistory settings={settings} patch={patch} />
            </SettingsSection>
            <SettingsSection
              group="jsonTransform"
              title={t('groups.jsonTransform')}
              sectionRefs={sectionRefs}
            >
              <GroupJsonTransform settings={settings} patch={patch} />
            </SettingsSection>
            <SettingsSection
              group="about"
              title={t('groups.about')}
              sectionRefs={sectionRefs}
            >
              <GroupAbout />
            </SettingsSection>
          </div>
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
            background: 'var(--surface-quiet)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 6,
          }}
        >
          <button
            onClick={async () => {
              const u = await settingsApi.reset();
              setSettings(u);
            }}
            style={btnGhost}
          >
            {t('footer.resetAll')}
          </button>
          <button onClick={() => setOpen(false)} style={btnPrimary}>
            {t('footer.done')}
          </button>
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
  children,
}: {
  group: Group;
  title: string;
  sectionRefs: React.MutableRefObject<Record<Group, HTMLElement | null>>;
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
      <h2 id={`settings-section-${group}`} className="jsonita-settings-section-title">
        {title}
      </h2>
      {children}
    </section>
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
    {
      label: t('shortcuts.builtIn.switchTabs'),
      keys: ['Tab', formatAccelerator('Shift+Tab')],
    },
    {
      label: t('shortcuts.builtIn.exitEditing'),
      keys: ['Esc'],
    },
    {
      label: t('shortcuts.builtIn.hideWindow'),
      keys: ['Esc', 'Esc'],
    },
    {
      label: t('shortcuts.builtIn.runCurrent'),
      keys: [formatAccelerator('CmdOrCtrl+Enter')],
    },
    {
      label: t('shortcuts.builtIn.aiFixCancel'),
      keys: ['Esc'],
    },
    {
      label: t('shortcuts.builtIn.history'),
      keys: [formatAccelerator('CmdOrCtrl+Y')],
    },
    {
      label: t('shortcuts.builtIn.settings'),
      keys: [formatAccelerator('CmdOrCtrl+,')],
    },
    {
      label: t('shortcuts.builtIn.clearInput'),
      keys: [formatAccelerator('CmdOrCtrl+K')],
    },
    {
      label: t('shortcuts.builtIn.zoom'),
      keys: [
        formatAccelerator('CmdOrCtrl+Plus'),
        formatAccelerator('CmdOrCtrl+Minus'),
        formatAccelerator('CmdOrCtrl+0'),
      ],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <SectionLabel>{t('shortcuts.customTitle')}</SectionLabel>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('shortcuts.toggle')}</span>
        <ShortcutInput
          action="toggle-window"
          value={settings.shortcutToggle}
          onChange={(v) => patch({ shortcutToggle: v })}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('shortcuts.restoreLast')}</span>
        <ShortcutInput
          action="restore-last"
          value={settings.shortcutRestoreLast}
          onChange={(v) => patch({ shortcutRestoreLast: v })}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>{t('shortcuts.splitToggle')}</span>
        <ShortcutInput
          ariaLabel={t('shortcuts.splitToggle')}
          value={settings.shortcutSplitToggle}
          onChange={(v) => patch({ shortcutSplitToggle: v })}
        />
      </div>
      <div style={shortcutDividerStyle} />
      <SectionLabel>{t('shortcuts.builtInTitle')}</SectionLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {builtInShortcuts.map((shortcut) => (
          <ReadonlyShortcutRow
            key={shortcut.label}
            label={shortcut.label}
            keys={shortcut.keys}
          />
        ))}
      </div>
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--text-muted)', marginTop: 8 }}>
        {t('shortcuts.hint', { reserved: reservedExamples })}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={sectionLabelStyle}>
      {children}
    </div>
  );
}

function ReadonlyShortcutRow({ label, keys }: { label: string; keys: string[] }) {
  return (
    <div style={readonlyShortcutRowStyle}>
      <span>{label}</span>
      <span style={keyGroupStyle}>
        {keys.map((key, index) => (
          <kbd key={`${key}-${index}`} style={keyCapStyle}>
            {key}
          </kbd>
        ))}
      </span>
    </div>
  );
}

function GroupGeneral({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={rowStyle}>
        <span>{t('general.language')}</span>
        <SegmentedControl
          value={settings.locale}
          options={[
            { value: 'en-US', label: 'English' },
            { value: 'zh-CN', label: '中文' },
          ]}
          onChange={(v) => patch({ locale: v })}
        />
      </div>
      <div style={rowStyle}>
        <span>{t('general.theme')}</span>
        <SegmentedControl
          value={settings.theme}
          options={[
            { value: 'system', label: 'System' },
            { value: 'light', label: 'Light' },
            { value: 'dark', label: 'Dark' },
          ]}
          onChange={(v) => patch({ theme: v })}
        />
      </div>
      <Row
        label={t('general.launchAtLogin')}
        on={settings.launchAtLogin}
        onChange={(v) => patch({ launchAtLogin: v })}
      />
      <Row
        label={t('general.hideOnBlur')}
        on={settings.hideOnBlur}
        onChange={(v) => patch({ hideOnBlur: v })}
      />
      <Row
        label={t('general.smartWidth')}
        on={settings.smartWidth}
        onChange={(v) => patch({ smartWidth: v })}
      />
      <Row
        label={t('general.singlePaneMode')}
        on={settings.singlePaneMode}
        onChange={(v) => patch({ singlePaneMode: v })}
      />
      <Row
        label={t('general.autoPasteClipboard')}
        on={settings.autoPasteClipboard}
        onChange={(v) => patch({ autoPasteClipboard: v })}
      />
    </div>
  );
}

function GroupAi({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row
        label={t('ai.enabled')}
        on={settings.aiEnabled}
        onChange={(v) => patch({ aiEnabled: v })}
      />
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginBottom: 4 }}>
          {t('ai.apiKey')}
        </div>
        <ApiKeyInput modelId={settings.aiModelId} />
      </div>
    </div>
  );
}

function GroupHistory({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={rowStyle}>
        <span>{t('history.limit')}</span>
        <SegmentedControl
          value={settings.historyLimit}
          options={[
            { value: 10, label: '10' },
            { value: 50, label: '50' },
            { value: 100, label: '100' },
            { value: 200, label: '200' },
          ]}
          onChange={(v) => patch({ historyLimit: v })}
        />
      </div>
    </div>
  );
}

function GroupJsonTransform({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Row
        label={t('jsonTransform.autoUnwrap')}
        on={settings.autoUnwrap}
        onChange={(v) => patch({ autoUnwrap: v })}
      />
      <div style={rowStyle}>
        <span>{t('jsonTransform.unwrapTimeoutMs')}</span>
        <input
          type="number"
          value={settings.unwrapTimeoutMs}
          onChange={(e) =>
            patch({ unwrapTimeoutMs: Number(e.target.value) || 200 })
          }
          style={{ ...inputStyle, width: 80 }}
        />
      </div>
      <Row
        label={t('jsonTransform.editorSoftWrap')}
        on={settings.editorSoftWrap}
        onChange={(v) => patch({ editorSoftWrap: v })}
      />
    </div>
  );
}

function Row({
  label,
  on,
  onChange,
}: {
  label: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label style={{ ...rowStyle, cursor: 'pointer' }}>
      <span>{label}</span>
      <SettingsCheckbox checked={on} onChange={onChange} />
    </label>
  );
}

function SettingsCheckbox({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <span style={checkboxWrapStyle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={checkboxInputStyle}
      />
      <span
        aria-hidden="true"
        style={{
          width: 40,
          height: 28,
          borderRadius: 5,
          background: checked ? 'var(--toggle-on)' : 'var(--control-bg-hover)',
          border: `1px solid ${checked ? 'transparent' : 'var(--control-border)'}`,
          display: 'inline-flex',
          alignItems: 'center',
          padding: 3,
          flexShrink: 0,
          transition:
            'background var(--dur-base) var(--ease-native), border-color var(--dur-base)',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: '#fff',
            boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
            transform: checked ? 'translateX(14px)' : 'translateX(0)',
            transition: 'transform var(--dur-base) var(--ease-native)',
          }}
        />
      </span>
    </span>
  );
}

function SegmentedControl<T extends string | number>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div style={segSmStyle}>
      {options.map((opt) => (
        <button
          key={String(opt.value)}
          type="button"
          onClick={() => onChange(opt.value)}
          style={value === opt.value ? segSmOnStyle : segSmOffStyle}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function GroupAbout() {
  return (
    <div style={aboutStyle}>
      <div style={aboutHeaderStyle}>
        <div>
          <div style={aboutTitleStyle}>Jsonita</div>
          <div style={aboutSubtitleStyle}>Tiny menu-bar JSON toolkit</div>
        </div>
        <button
          type="button"
          onClick={() => systemApi.openGithub().catch(() => {})}
          style={aboutGithubButtonStyle}
        >
          GitHub
        </button>
      </div>

      <div style={aboutMetaGridStyle}>
        <AboutMeta label="Version" value="1.0.0-beta.2" />
        <AboutMeta label="License" value="MIT" />
        <AboutMeta label="Author" value="Jin Huang" />
      </div>

      <div style={aboutPathsStyle}>
        <div style={sectionLabelStyle}>Data &amp; logs</div>
        <div style={aboutPathStyle}>
          ~/Library/Application Support/Jsonita/
        </div>
        <div style={aboutPathStyle}>
          ~/Library/Logs/Jsonita/
        </div>
      </div>
    </div>
  );
}

function AboutMeta({ label, value }: { label: string; value: string }) {
  return (
    <div style={aboutMetaStyle}>
      <span style={aboutMetaLabelStyle}>{label}</span>
      <span style={aboutMetaValueStyle}>{value}</span>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  minHeight: 40,
  padding: '9px 0',
};

const sectionLabelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-xs)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0,
};

const aboutStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  fontSize: 'var(--fs-sm)',
};

const aboutHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  paddingBottom: 12,
  borderBottom: '1px solid var(--border)',
};

const aboutTitleStyle: React.CSSProperties = {
  color: 'var(--text)',
  fontSize: 'var(--fs-lg)',
  fontWeight: 700,
  lineHeight: 1.15,
};

const aboutSubtitleStyle: React.CSSProperties = {
  marginTop: 4,
  color: 'var(--text-muted)',
  lineHeight: 1.35,
};

const aboutGithubButtonStyle: React.CSSProperties = {
  flex: '0 0 auto',
  padding: '4px 10px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--control-border)',
  background: 'var(--control-bg)',
  color: 'var(--text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
};

const aboutMetaGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
  gap: 8,
};

const aboutMetaStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
  minWidth: 0,
};

const aboutMetaLabelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-xs)',
};

const aboutMetaValueStyle: React.CSSProperties = {
  color: 'var(--text)',
  fontWeight: 600,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const aboutPathsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  paddingTop: 4,
};

const aboutPathStyle: React.CSSProperties = {
  padding: '5px 8px',
  borderRadius: 'var(--radius-sm)',
  background: 'var(--control-bg)',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-xs)',
  overflowWrap: 'anywhere',
};

const shortcutDividerStyle: React.CSSProperties = {
  height: 1,
  background: 'var(--border)',
  margin: '2px 0',
};

const readonlyShortcutRowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: 16,
  minHeight: 28,
  color: 'var(--text)',
};

const keyGroupStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  gap: 4,
  flexWrap: 'wrap',
};

const keyCapStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--control-border)',
  background: 'var(--control-bg)',
  color: 'var(--text)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-sm)',
  lineHeight: 1.2,
};

const inputStyle: React.CSSProperties = {
  padding: '5px 10px',
  background: 'var(--control-bg)',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-md)',
  color: 'var(--text)',
};

const segSmStyle: React.CSSProperties = {
  display: 'inline-flex',
  padding: 2,
  background: 'var(--control-bg)',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-md)',
  flexShrink: 0,
};

const segSmOffStyle: React.CSSProperties = {
  border: 0,
  background: 'transparent',
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-base)',
  fontWeight: 500,
  padding: '3px 12px',
  borderRadius: 'var(--radius-sm)',
  cursor: 'pointer',
};

const segSmOnStyle: React.CSSProperties = {
  ...segSmOffStyle,
  background: 'var(--surface-raised)',
  color: 'var(--text)',
  fontWeight: 600,
  boxShadow: 'var(--shadow-sm)',
};

const checkboxWrapStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 40,
  height: 28,
  flexShrink: 0,
};

const checkboxInputStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  padding: '8px 18px',
  background: 'transparent',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--fs-md)',
  fontWeight: 500,
  cursor: 'pointer',
  color: 'var(--text)',
};

const btnPrimary: React.CSSProperties = {
  padding: '8px 18px',
  background: 'var(--primary)',
  color: '#fff',
  border: '1px solid var(--primary)',
  borderRadius: 'var(--radius-md)',
  fontSize: 'var(--fs-md)',
  fontWeight: 500,
  cursor: 'pointer',
};
