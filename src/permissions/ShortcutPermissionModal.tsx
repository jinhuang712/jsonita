import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';

/**
 * macOS shortcut permission recovery modal.
 *
 * 视觉锚：design/screens.md § 9 macOS 权限引导 Modal。
 * 触发：App.tsx 检测 shortcut_status === false；Modal 打开期间轮询 shortcut_retry，授权后自动关闭。
 * M0-N6：文案全走 i18n（errors + common namespace）。
 */

interface Props {
  onClose: () => void;
}

export function ShortcutPermissionModal({ onClose }: Props) {
  const { t } = useTranslation('errors');
  const { t: tc } = useTranslation('common');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-permission-modal-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--bg-overlay)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: 380,
          background: 'color-mix(in srgb, var(--bg-elevated) 94%, transparent)',
          border: '1px solid var(--glass-border)',
          borderRadius: 'var(--radius-xl)',
          padding: '18px 20px',
          boxShadow: 'var(--shadow-lg)',
          color: 'var(--text)',
          fontFamily: 'var(--font-sans)',
          backdropFilter: 'var(--glass-blur)',
          WebkitBackdropFilter: 'var(--glass-blur)',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            aria-hidden="true"
            style={{
              flex: '0 0 auto',
              width: 30,
              height: 30,
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--primary-edge)',
              background: 'var(--control-bg-active)',
              color: 'color-mix(in srgb, var(--primary) 72%, var(--text))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-mono)',
              fontSize: 'var(--fs-sm)',
              fontWeight: 650,
            }}
          >
            ⌘
          </div>
          <div style={{ minWidth: 0 }}>
            <div
              id="shortcut-permission-modal-title"
              style={{ fontSize: 'var(--fs-md)', fontWeight: 650, marginBottom: 5 }}
            >
              {t('shortcutPermissionRequired.title')}
            </div>
            <div
              style={{
                fontSize: 'var(--fs-sm)',
                color: 'var(--text-muted)',
                lineHeight: 1.55,
              }}
            >
              {t('shortcutPermissionRequired.body', { key: '⌘⇧J' })}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            gap: 8,
            justifyContent: 'flex-end',
            marginTop: 18,
          }}
        >
          <ActionButton variant="secondary" onClick={onClose}>
            {tc('later')}
          </ActionButton>
          <ActionButton
            variant="primary"
            onClick={async () => {
              await invoke('open_accessibility_settings');
            }}
          >
            {tc('openSystemSettings')}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}

