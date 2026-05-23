/**
 * Diff 计算 — 走 npm `diff` 的 diffLines（spec/11 § 8.2 行级 diff）。
 *
 * 字符级 diff 留 v1.1（M3-N6 README 不展示）。
 */

import { diffLines } from 'diff';

export type DiffLine = { type: 'eq' | 'add' | 'del'; text: string };

export function computeDiff(before: string, after: string): DiffLine[] {
  const parts = diffLines(before, after, { newlineIsToken: false });
  const out: DiffLine[] = [];
  for (const p of parts) {
    const lines = p.value.split(/\n/);
    if (lines[lines.length - 1] === '') lines.pop();
    for (const line of lines) {
      out.push({
        type: p.added ? 'add' : p.removed ? 'del' : 'eq',
        text: line,
      });
    }
  }
  return out;
}
