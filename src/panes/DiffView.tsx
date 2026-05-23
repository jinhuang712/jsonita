import { useMemo } from 'react';
import { computeDiff } from './diff';

/**
 * AI Fix 接受前 diff 显示 — 左右合并行式（unified diff，spec/01 § 8 视觉锚）。
 */

interface Props {
  before: string;
  after: string;
}

export function DiffView({ before, after }: Props) {
  const lines = useMemo(() => computeDiff(before, after), [before, after]);
  return (
    <div
      style={{
        height: '100%',
        overflow: 'auto',
        fontFamily: 'var(--font-mono)',
        fontSize: 'var(--fs-editor)',
        padding: 'var(--sp-3) var(--sp-4)',
        background: 'var(--bg-card)',
        lineHeight: 1.75,
      }}
    >
      {lines.map((l, i) => {
        const bg =
          l.type === 'add'
            ? 'rgba(6,183,143,0.10)'
            : l.type === 'del'
              ? 'rgba(220,38,38,0.08)'
              : 'transparent';
        const sigil = l.type === 'add' ? '+' : l.type === 'del' ? '-' : ' ';
        const sigilColor =
          l.type === 'add'
            ? 'var(--ok)'
            : l.type === 'del'
              ? 'var(--danger)'
              : 'var(--text-faint)';
        return (
          <div key={i} style={{ background: bg, whiteSpace: 'pre' }}>
            <span style={{ color: sigilColor, paddingRight: 8 }}>{sigil}</span>
            <span>{l.text}</span>
          </div>
        );
      })}
    </div>
  );
}
