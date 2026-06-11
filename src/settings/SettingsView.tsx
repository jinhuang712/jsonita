import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settings as settingsApi, system as systemApi } from '../ipc/commands';
import { on } from '../ipc/events';
import { useSettingsStore, type Settings } from '../store/settings';
import { useUiStore } from '../store/ui';
import { formatAccelerator } from '../keyboard/accelerators';
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
          id="settings-page-title"
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border)',
            fontSize: 'var(--fs-lg)',
            fontWeight: 600,
          }}
        >
          {t('title')}
        </div>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <nav
            style={{
              width: 150,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-elevated-nav)',
              padding: 'var(--sp-2) 6px',
            }}
          >
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => scrollToGroup(g)}
                aria-current={activeGroup === g ? 'page' : undefined}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: 'var(--fs-sm)',
                  textAlign: 'left',
                  background:
                    activeGroup === g ? 'var(--control-bg-active)' : 'transparent',
                  color:
                    activeGroup === g
                      ? 'color-mix(in srgb, var(--primary) 66%, var(--text))'
                      : 'var(--text-muted)',
                  border: 'none',
                  borderLeft: '2px solid transparent',
                  boxShadow:
                    activeGroup === g
                      ? 'inset 2px 0 0 var(--primary-edge)'
                      : 'none',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontWeight: activeGroup === g ? 560 : 450,
                }}
              >
                {t(`groups.${g}` as 'groups.general')}
              </button>
            ))}
          </nav>
          <div
            className="jsonita-settings-scroll"
            ref={scrollRef}
            style={{
              flex: 1,
              padding: 'var(--sp-5) var(--sp-6)',
              overflow: 'auto',
              fontSize: 'var(--fs-sm)',
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
      style={settingsSectionStyle}
      aria-labelledby={`settings-section-${group}`}
    >
      <h2 id={`settings-section-${group}`} style={settingsSectionTitleStyle}>
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
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
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
        <select
          value={settings.locale}
          onChange={(e) => patch({ locale: e.target.value as 'en-US' | 'zh-CN' })}
          style={inputStyle}
          aria-label={t('general.language')}
        >
          <option value="en-US">English</option>
          <option value="zh-CN">简体中文</option>
        </select>
      </div>
      <div style={rowStyle}>
        <span>{t('general.theme')}</span>
        <select
          value={settings.theme}
          onChange={(e) =>
            patch({ theme: e.target.value as 'system' | 'light' | 'dark' })
          }
          style={inputStyle}
          aria-label={t('general.theme')}
        >
          <option value="system">System</option>
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
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
        <select
          value={settings.historyLimit}
          onChange={(e) => patch({ historyLimit: Number(e.target.value) })}
          style={inputStyle}
        >
          <option value={10}>10</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
          <option value={200}>200</option>
        </select>
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
      <span aria-hidden="true" style={checked ? checkboxCheckedStyle : checkboxBoxStyle}>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M3 6.1 5.1 8.2 9 3.8"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
    </span>
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
  minHeight: 34,
  padding: '7px 0',
  borderBottom: '1px solid var(--border)',
};

const sectionLabelStyle: React.CSSProperties = {
  color: 'var(--text-muted)',
  fontSize: 'var(--fs-xs)',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: 0,
};

const settingsSectionStyle: React.CSSProperties = {
  padding: '0 0 30px',
  scrollMarginTop: 8,
};

const settingsSectionTitleStyle: React.CSSProperties = {
  margin: '0 0 10px',
  color: 'var(--text)',
  fontSize: 'var(--fs-md)',
  fontWeight: 650,
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
  padding: '2px 6px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--control-border)',
  background: 'var(--control-bg)',
  color: 'var(--text-muted)',
  fontFamily: 'var(--font-mono)',
  fontSize: 'var(--fs-xs)',
  lineHeight: 1.2,
};

const inputStyle: React.CSSProperties = {
  padding: '2px 8px',
  background: 'var(--control-bg)',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text)',
};

const checkboxWrapStyle: React.CSSProperties = {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
};

const checkboxInputStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  margin: 0,
  opacity: 0,
  cursor: 'pointer',
};

const checkboxBoxStyle: React.CSSProperties = {
  width: 15,
  height: 15,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
  border: '1px solid var(--control-border)',
  background: 'var(--control-bg)',
  boxShadow: 'inset 0 1px 0 color-mix(in srgb, var(--text) 6%, transparent)',
  transition:
    'background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out)',
};

const checkboxCheckedStyle: React.CSSProperties = {
  ...checkboxBoxStyle,
  border: '1px solid var(--primary-edge)',
  background: 'var(--control-bg-active)',
  color: 'color-mix(in srgb, var(--primary) 78%, var(--text))',
  boxShadow: 'inset 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent)',
};

const btnGhost: React.CSSProperties = {
  padding: '4px 12px',
  background: 'var(--control-bg)',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
  color: 'var(--text)',
};

const btnPrimary: React.CSSProperties = {
  padding: '4px 12px',
  background: 'var(--control-bg-active)',
  color: 'color-mix(in srgb, var(--primary) 70%, var(--text))',
  border: '1px solid var(--primary-edge)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
