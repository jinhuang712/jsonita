import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ai } from '../ipc/commands';
import { ActionButton } from '../components/ActionButton';
import type { Settings } from '../store/settings';

/**
 * API key 输入 + Test + Reset。两种编辑模式共用。
 *
 * Test：用当前编辑中的 protocol/url/model + 输入的 key 实打探活；成功后落盘 key。
 * Reset：protocol/url/model 复位默认 + 删除已存 key（含旧 deepseek_api_key）。
 * key 直接传给 ai_test_connection，不先存 secrets，避免污染已有 key。
 */

interface Props {
  settings: Settings;
  patch: (p: Partial<Settings>) => void | Promise<void>;
  blockTest?: boolean;
}

export function ApiKeyInput({ settings, patch, blockTest }: Props) {
  const { t } = useTranslation('settings');
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  useEffect(() => {
    ai.hasApiKey().then(setHasKey).catch(() => {});
  }, []);

  const test = async () => {
    setTesting(true);
    setMsg(null);
    try {
      const r = await ai.testConnection(
        keyInput,
        settings.aiProtocol,
        settings.aiBaseUrl,
        settings.aiModelId,
      );
      if (r.ok) {
        await ai.setApiKey(keyInput);
        setKeyInput('');
        setHasKey(true);
        setMsg({ kind: 'ok', text: `${t('ai.apiKeySaved')} · ${r.modelEchoed}` });
      } else {
        setMsg({ kind: 'err', text: r.modelEchoed });
      }
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const reset = async () => {
    try {
      await ai.deleteApiKey();
      patch({ aiProtocol: 'openai', aiBaseUrl: '', aiModelId: '' });
      setKeyInput('');
      setHasKey(false);
      setMsg({ kind: 'ok', text: t('ai.resetDone') });
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={fieldLabelStyle}>{t('ai.apiKey')}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={hasKey ? t('ai.apiKeySavedPlaceholder') : '••••••••'}
          style={inputStyle}
          autoComplete="off"
        />
        <ActionButton variant="secondary" onClick={test} disabled={testing || !keyInput || blockTest}>
          {testing ? '…' : t('ai.test')}
        </ActionButton>
        <ActionButton variant="secondary" onClick={reset}>
          {t('ai.reset')}
        </ActionButton>
      </div>
      {msg && (
        <div
          style={{
            fontSize: 'var(--fs-xs)',
            color: msg.kind === 'ok' ? 'var(--ok)' : 'var(--danger)',
            wordBreak: 'break-word',
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 'var(--fs-xs)',
  color: 'var(--text-muted)',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  padding: '4px 8px',
  background: 'var(--control-bg)',
  border: '1px solid var(--control-border)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text)',
};
