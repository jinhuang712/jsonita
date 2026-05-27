import { useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { shortcuts, type ShortcutAction, type ShortcutRegisterResp } from '../ipc/commands';
import { formatAccelerator } from '../keyboard/accelerators';

/**
 * ShortcutInput — 录入快捷键，调 shortcut_register 验 + 注册。
 *
 * Spec ref: spec/04 § 4.7 · spec/07 § 2.3 / § 2.4
 * 行为：
 *   - 未聚焦：显当前值
 *   - 聚焦：listen keydown → 格式化组合 → 调 shortcut_register
 *   - Reserved → 默认阻塞 patch + Tooltip 警告 + "override" 链按钮走二次确认 Modal（M2-N5 minimal: 简化为 confirm dialog）
 *   - Conflict → Tooltip 警告 + 保留旧绑定
 *   - Ok → 绿色短暂闪烁
 */

interface Props {
  action: ShortcutAction;
  value: string;
  onChange: (next: string) => void;
}

export function ShortcutInput({ action, value, onChange }: Props) {
  const { t } = useTranslation('settings');
  const [recording, setRecording] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'reserved'; text: string; acc?: string } | null>(null);

  const handleKeyDown = async (e: KeyboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // 忽略单独按 modifier 键
    if (['Control', 'Meta', 'Alt', 'Shift'].includes(e.key)) return;

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
      setMsg({ kind: 'err', text: String(e) });
    }
  };

  const overrideReserved = async () => {
    // 二次确认（spec/07 § 2.3 override Modal；M2-N5 minimal 用 window.confirm）
    if (!msg?.acc) return;
    const acc = msg.acc;
    const ok = window.confirm(t('shortcuts.overrideConfirm', { accelerator: formatAccelerator(acc) }));
    if (ok) {
      setMsg(null);
      await tryRegister(acc, true);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        tabIndex={0}
        onFocus={() => {
          setRecording(true);
          setMsg(null);
        }}
        onBlur={() => setRecording(false)}
        onKeyDown={recording ? handleKeyDown : undefined}
        style={{
          padding: '4px 10px',
          background: recording ? 'var(--primary-soft)' : 'var(--bg-card)',
          border: `1px solid ${recording ? 'var(--primary)' : 'var(--border-strong)'}`,
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-mono)',
          fontSize: 'var(--fs-sm)',
          color: 'var(--text)',
          cursor: 'pointer',
          minWidth: 140,
          outline: 'none',
        }}
        role="button"
        aria-label={`Shortcut for ${action}`}
      >
        {recording
          ? t('shortcuts.recordingPlaceholder')
          : value
            ? formatAccelerator(value)
            : t('shortcuts.noneBound')}
      </div>
      {msg && (
        <div
          style={{
            fontSize: 'var(--fs-xs)',
            color:
              msg.kind === 'ok'
                ? 'var(--ok)'
                : msg.kind === 'reserved'
                  ? 'var(--warn)'
                  : 'var(--danger)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <span>{msg.text}</span>
          {msg.kind === 'reserved' && (
            <button
              onClick={overrideReserved}
              style={{
                padding: '0 6px',
                background: 'var(--bg-card)',
                border: '1px solid var(--warn)',
                color: 'var(--warn)',
                borderRadius: 4,
                fontSize: 'var(--fs-xs)',
                cursor: 'pointer',
              }}
            >
              {t('shortcuts.overrideButton')}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
