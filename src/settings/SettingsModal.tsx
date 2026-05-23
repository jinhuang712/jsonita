import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { settings as settingsApi } from '../ipc/commands';
import { on } from '../ipc/events';
import { useSettingsStore, type Settings } from '../store/settings';
import { useUiStore } from '../store/ui';
import { ApiKeyInput } from './ApiKeyInput';
import { ShortcutInput } from './ShortcutInput';

/**
 * 设置 Modal — 6 分组 nav + 字段。
 *
 * 视觉锚：spec/01_mockups.html § 4 设置 Modal
 * Spec ref: spec/04 § 4.6 SettingsModal
 * M2-N1 minimal：General + AI + JSON Transform + History 4 组（Shortcuts M2-N5；About M3）；
 * 字段：launchAtLogin / hideOnBlur / autoUnwrap / aiEnabled / historyLimit / smartWidth。
 * 即时生效：onChange 立即 settings_set。
 */

type Group = 'general' | 'shortcuts' | 'ai' | 'history' | 'jsonTransform' | 'about';

const GROUPS: Group[] = ['general', 'shortcuts', 'ai', 'history', 'jsonTransform', 'about'];

export function SettingsModal() {
  const { t } = useTranslation('settings');
  const open = useUiStore((s) => s.settingsModalOpen);
  const setOpen = useUiStore((s) => s.setSettingsModalOpen);
  const settings = useSettingsStore((s) => s.settings);
  const setSettings = useSettingsStore((s) => s.setSettings);
  const [activeGroup, setActiveGroup] = useState<Group>('general');

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
    on('settings:changed' as 'window:hidden', (payload: unknown) => {
      setSettings(payload as Settings);
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

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
      onClick={() => setOpen(false)}
    >
      <div
        style={{
          width: 600,
          maxHeight: '70vh',
          background: 'var(--bg-card)',
          borderRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'var(--font-sans)',
          color: 'var(--text)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          id="settings-modal-title"
          style={{
            padding: '12px 16px',
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
              width: 140,
              borderRight: '1px solid var(--border)',
              background: 'var(--bg-card)',
              padding: 'var(--sp-2) 0',
            }}
          >
            {GROUPS.map((g) => (
              <button
                key={g}
                onClick={() => setActiveGroup(g)}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '6px 14px',
                  fontSize: 'var(--fs-sm)',
                  textAlign: 'left',
                  background:
                    activeGroup === g ? 'var(--primary-soft)' : 'transparent',
                  color:
                    activeGroup === g ? 'var(--primary)' : 'var(--text-muted)',
                  border: 'none',
                  borderLeft:
                    activeGroup === g
                      ? '2px solid var(--primary)'
                      : '2px solid transparent',
                  cursor: 'pointer',
                  fontWeight: activeGroup === g ? 600 : 400,
                }}
              >
                {t(`groups.${g}` as 'groups.general')}
              </button>
            ))}
          </nav>
          <div style={{ flex: 1, padding: 'var(--sp-4)', overflow: 'auto', fontSize: 'var(--fs-sm)' }}>
            {activeGroup === 'general' && (
              <GroupGeneral settings={settings} patch={patch} />
            )}
            {activeGroup === 'ai' && (
              <GroupAi settings={settings} patch={patch} />
            )}
            {activeGroup === 'history' && (
              <GroupHistory settings={settings} patch={patch} />
            )}
            {activeGroup === 'jsonTransform' && (
              <GroupJsonTransform settings={settings} patch={patch} />
            )}
            {activeGroup === 'shortcuts' && (
              <GroupShortcuts settings={settings} patch={patch} />
            )}
            {activeGroup === 'about' && <GroupAbout />}
          </div>
        </div>
        <div
          style={{
            padding: '8px 16px',
            borderTop: '1px solid var(--border)',
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

function GroupShortcuts({ settings, patch }: GroupProps) {
  const { t } = useTranslation('settings');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)', marginTop: 8 }}>
        {t('shortcuts.hint')}
      </div>
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
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', padding: 'var(--sp-4)' }}>
      {text}
    </div>
  );
}

function GroupAbout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--fs-sm)' }}>
      <div>
        <span style={{ fontWeight: 600 }}>Jsonita</span>{' '}
        <span style={{ color: 'var(--text-muted)' }}>v0.3.0-m0 · MIT License</span>
      </div>
      <div style={{ color: 'var(--text-muted)' }}>
        Tiny menu-bar JSON toolkit for macOS.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
        <div style={{ color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>Data &amp; logs</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
          ~/Library/Application Support/Jsonita/
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-xs)' }}>
          ~/Library/Logs/Jsonita/
        </div>
      </div>
      <div style={{ marginTop: 8, color: 'var(--text-muted)', fontSize: 'var(--fs-xs)' }}>
        Author: Jin Huang
      </div>
    </div>
  );
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '6px 0',
  borderBottom: '1px solid var(--border)',
};

const inputStyle: React.CSSProperties = {
  padding: '2px 8px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text)',
};

const btnGhost: React.CSSProperties = {
  padding: '4px 12px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
  color: 'var(--text)',
};

const btnPrimary: React.CSSProperties = {
  padding: '4px 12px',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  cursor: 'pointer',
};
