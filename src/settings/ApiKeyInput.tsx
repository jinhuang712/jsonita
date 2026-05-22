import { useEffect, useState } from 'react';
import { ai } from '../ipc/commands';

/**
 * API key 输入 + 测试连接 + 保存。
 *
 * 视觉锚：spec/01_mockups.html § 6 Settings AI 分组
 * Spec ref: spec/04 § 4.8 ApiKeyInput · spec/11 § 9 测试连接
 * 关键：key 直接传给 ai_test_connection（不先存 Keychain），test 通过后 set。
 */

interface Props {
  modelId: string;
}

export function ApiKeyInput({ modelId }: Props) {
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
      setMsg({ kind: 'ok', text: 'Saved to Keychain' });
    } catch (e) {
      setMsg({ kind: 'err', text: String(e) });
    }
  };

  const remove = async () => {
    try {
      await ai.deleteApiKey();
      setHasKey(false);
      setMsg({ kind: 'ok', text: 'Removed from Keychain' });
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
          placeholder={hasKey ? '••••••••（已存 Keychain，可输入新 key 覆盖）' : 'sk-...'}
          style={inputStyle}
          autoComplete="off"
        />
        <button
          onClick={test}
          disabled={testing || !keyInput}
          style={btnGhost}
        >
          {testing ? '...' : 'Test'}
        </button>
        <button
          onClick={save}
          disabled={!keyInput}
          style={btnPrimary}
        >
          Save
        </button>
        {hasKey && (
          <button onClick={remove} style={btnDanger}>
            Remove
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
