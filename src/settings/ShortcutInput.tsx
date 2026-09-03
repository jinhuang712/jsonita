import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { shortcuts, type ShortcutAction, type ShortcutRegisterResp } from '../ipc/commands';
import { formatError } from '../ipc/error';
import { formatAccelerator, isMacPlatform } from '../keyboard/accelerators';

/**
 * ShortcutInput — 录入快捷键，调 shortcut_register 验 + 注册。
 *
 * 行为：
 *   - 未聚焦：显当前值
 *   - 聚焦：listen keydown → 格式化组合 → 调 shortcut_register
 *   - Reserved → 阻塞 patch + 警告 + "override" 走二次确认
 *   - Conflict → 警告 + 保留旧绑定
 *   - Ok → 绿色确认
 */

interface Props {
  action?: ShortcutAction;
  ariaLabel?: string;
  value: string;
  onChange: (next: string) => void;
}

export function ShortcutInput({ action, ariaLabel, value, onChange }: Props) {
  const { t } = useTranslation('settings');
  const [recording, setRecording] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'reserved'; text: string; acc?: string } | null>(null);

  const handleKeyDown = async (e: KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // 忽略单独按 modifier 键
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

    // 至少一个非 Shift 修饰键：否则裸键（如 "A"）或纯 Shift 组合会在编辑器打字时被误触发。
    if (!e.metaKey && !e.ctrlKey && !e.altKey) {
      setRecording(false);
      const modifierHint = isMacPlatform()
        ? t('shortcuts.needModifier')
        : t('shortcuts.needModifierNonMac');
      setMsg({ kind: 'err', text: modifierHint });
      return;
    }

    const parts: string[] = [];
    if (e.metaKey) parts.push('Cmd');
    if (e.ctrlKey) parts.push('Ctrl');
    if (e.altKey) parts.push('Alt');
    if (e.shiftKey) parts.push('Shift');

    let keyPart: string;
    if (e.key.length === 1) {
      keyPart = e.key.toUpperCase();
    } else if (e.key.startsWith('F') && /^F\d+$/.test(e.key)) {
      keyPart = e.key;
    } else {
      keyPart = e.key;
    }
    parts.push(keyPart);

    const acc = parts.join('+');
    setRecording(false);

    await tryRegister(acc, false);
  };

  const tryRegister = async (acc: string, forceOverride: boolean) => {
    try {
      if (!action) {
        onChange(acc);
        setMsg({
          kind: 'ok',
          text: t('shortcuts.bound', { accelerator: formatAccelerator(acc) }),
          acc,
        });
        return;
      }

      const r: ShortcutRegisterResp = await shortcuts.register(action, acc, forceOverride);
      const displayAcc = formatAccelerator(acc);
      switch (r.kind) {
        case 'ok':
          onChange(acc);
          setMsg({ kind: 'ok', text: t('shortcuts.bound', { accelerator: displayAcc }), acc });
          break;
        case 'reserved':
          setMsg({
            kind: 'reserved',
            text: t('shortcuts.reserved', { accelerator: displayAcc }),
            acc,
          });
          break;
        case 'conflict':
          setMsg({
            kind: 'err',
            text: r.withApp
              ? t('shortcuts.conflictWithApp', { app: r.withApp })
              : t('shortcuts.conflictNoApp'),
          });
          break;
        case 'invalid-accelerator':
          setMsg({ kind: 'err', text: t('shortcuts.invalid', { reason: r.reason }) });
          break;
      }
    } catch (e) {
      setMsg({ kind: 'err', text: formatError(e) });
    }
  };

  const overrideReserved = async () => {
    if (!msg?.acc) return;
    const acc = msg.acc;
    const ok = window.confirm(t('shortcuts.overrideConfirm', { accelerator: formatAccelerator(acc) }));
    if (ok) {
      setMsg(null);
      await tryRegister(acc, true);
    }
  };

  const noteClass =
    msg?.kind === 'ok'
      ? 'jsonita-field-note jsonita-field-note-ok'
      : msg?.kind === 'reserved'
        ? 'jsonita-field-note jsonita-field-note-warn'
        : 'jsonita-field-note jsonita-field-note-error';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
      <div
        tabIndex={0}
        onFocus={() => {
          setRecording(true);
          setMsg(null);
        }}
        onBlur={() => setRecording(false)}
        onKeyDown={recording ? handleKeyDown : undefined}
        className={
          recording
            ? 'jsonita-shortcut-input jsonita-shortcut-input-recording'
            : 'jsonita-shortcut-input'
        }
        role="button"
        aria-label={ariaLabel ?? `Shortcut for ${action}`}
      >
        {recording
          ? t('shortcuts.recordingPlaceholder')
          : value
            ? formatAccelerator(value)
            : t('shortcuts.noneBound')}
      </div>
      {msg && (
        <div className={noteClass} style={{ display: 'flex', gap: 8, alignItems: 'center', textAlign: 'right' }}>
          <span>{msg.text}</span>
          {msg.kind === 'reserved' && (
            <button type="button" onClick={overrideReserved} className="jsonita-shortcut-override">
              {t('shortcuts.overrideButton')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
