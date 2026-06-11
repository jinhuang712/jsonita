import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ai } from '../ipc/commands';

/**
 * API key 输入 + 测试连接 + 保存。
 *
 * 视觉锚：design/01_mockups.md § 6 Settings AI 分组
 * Spec ref: design/04_components.md ApiKeyInput · spec/08_ai_repair.md 测试连接
 * 关键：key 直接传给 ai_test_connection（不先存 secrets.json），test 通过后 set。
 */

interface Props {
  modelId: string;
}

export function ApiKeyInput({ modelId }: Props) {
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
      const r = await ai.testConnection(keyInput, modelId);
      if (r.ok) {
        setMsg({ kind: 'ok', text: `OK · ${r.modelEchoed}` });
      } else {
        setMsg({ kind: 'err', text: r.modelEchoed });
      }
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    } finally {
      setTesting(false);
    }
  };

  const save = async () => {
    try {
      await ai.setApiKey(keyInput);
      setKeyInput('');
      setHasKey(true);
      setMsg({ kind: 'ok', text: t('ai.apiKeySaved') });
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    }
  };

  const remove = async () => {
    try {
      await ai.deleteApiKey();
      setHasKey(false);
      setMsg({ kind: 'ok', text: t('ai.apiKeyRemoved') });
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="password"
          value={keyInput}
          onChange={(e) => setKeyInput(e.target.value)}
          placeholder={hasKey ? t('ai.apiKeySavedPlaceholder') : 'sk-...'}
          style={inputStyle}
          autoComplete="off"
        />
        <button
          onClick={test}
          disabled={testing || !keyInput}
          style={btnGhost}
        >
          {testing ? '...' : t('ai.test')}
        </button>
        <button
          onClick={save}
          disabled={!keyInput}
          style={btnPrimary}
        >
          {t('ai.save')}
        </button>
        {hasKey && (
          <button onClick={remove} style={btnDanger}>
            {t('ai.remove')}
          </button>
        )}
      </div>
      {msg && (
        <div
          style={{
            fontSize: 'var(--fs-xs)',
            color: msg.kind === 'ok' ? 'var(--ok)' : 'var(--danger)',
          }}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: '2px 8px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-sm)',
  color: 'var(--text)',
};

const btnGhost: React.CSSProperties = {
  padding: '2px 10px',
  background: 'var(--bg-card)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
  color: 'var(--text)',
};

const btnPrimary: React.CSSProperties = {
  padding: '2px 10px',
  background: 'var(--primary)',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
  padding: '2px 10px',
  background: 'var(--bg-card)',
  color: 'var(--danger)',
  border: '1px solid var(--danger)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 'var(--fs-xs)',
  cursor: 'pointer',
};
