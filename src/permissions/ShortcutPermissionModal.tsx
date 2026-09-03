import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { ActionButton } from '../components/ActionButton';

/**
 * macOS shortcut permission recovery modal.
 *
 * 视觉锚：design/screens.md § Global Interaction。
 * 触发：App.tsx 检测 shortcut_status === false；Modal 打开期间轮询 shortcut_retry，授权后自动关闭。
 * 卡片走 var(--bg-elevated) 玻璃卡 + 一枚 var(--primary) 键帽标记；文案全走 i18n。
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
      className="jsonita-modal-backdrop"
    >
      <div className="jsonita-modal">
        <div className="jsonita-modal-glyph" aria-hidden="true">
          ⌘
        </div>
        <div id="shortcut-permission-modal-title" className="jsonita-modal-title">
          {t('shortcutPermissionRequired.title')}
        </div>
        <div className="jsonita-modal-body">
          {t('shortcutPermissionRequired.body', { key: '⌘⇧J' })}
        </div>
        <div className="jsonita-modal-actions">
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
