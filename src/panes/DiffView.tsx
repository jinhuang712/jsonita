import { useMemo } from 'react';
import { computeDiff } from './diff';

/**
 * AI Fix 接受前 diff 显示 — unified diff（design/screens.md § AI Fix）。
 * 行底色只用状态色的 10% 淡底，符号列承担颜色。
 */

interface Props {
  before: string;
  after: string;
}

const LINE_CLASS = {
  add: 'jsonita-diff-line jsonita-diff-line-add',
  del: 'jsonita-diff-line jsonita-diff-line-del',
  same: 'jsonita-diff-line',
} as const;

export function DiffView({ before, after }: Props) {
  const lines = useMemo(() => computeDiff(before, after), [before, after]);
  return (
    <div className="jsonita-diff">
      {lines.map((l, i) => {
        const kind = l.type === 'add' ? 'add' : l.type === 'del' ? 'del' : 'same';
        const sigil = kind === 'add' ? '+' : kind === 'del' ? '−' : ' ';
        return (
          <div key={i} className={LINE_CLASS[kind]}>
            <span className="jsonita-diff-sigil">{sigil}</span>
            <span>{l.text}</span>
          </div>
        );
      })}
    </div>
  );
}
