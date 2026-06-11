import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

/**
 * macOS shortcut permission recovery modal.
 *
 * 视觉锚：design/01_mockups.md § 9 macOS 权限引导 Modal。
 * 触发：App.tsx 检测 shortcut_status === false / 收到 `permission:accessibility_missing` event。
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
        background: 'rgba(0,0,0,0.32)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: 360,
          background: '#FFFFFF',
          borderRadius: 14,
          padding: '20px 22px',
          textAlign: 'center',
          boxShadow: '0 12px 36px rgba(0,0,0,0.12)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "SF Pro Display", system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 30, marginBottom: 8 }}>⌨️</div>
        <div id="shortcut-permission-modal-title" style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
          {t('shortcutPermissionRequired.title')}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#6B7280',
            lineHeight: 1.55,
            marginBottom: 16,
          }}
        >
          {t('shortcutPermissionRequired.body', { key: '⌘⇧J' })}
        </div>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <button onClick={onClose} style={btnGhost}>
            {tc('later')}
          </button>
          <button
            onClick={async () => {
              await invoke('open_accessibility_settings');
            }}
            style={btnPrimary}
          >
            {tc('openSystemSettings')}
          </button>
        </div>
      </div>
    </div>
  );
}

const btnGhost: React.CSSProperties = {
  padding: '6px 14px',
  background: '#FFFFFF',
  border: '1px solid #D1D5DB',
  borderRadius: 4,
  fontSize: 12,
  cursor: 'pointer',
};

const btnPrimary: React.CSSProperties = {
  padding: '6px 14px',
  background: '#057AF3',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: 4,
  fontSize: 12,
  cursor: 'pointer',
};
