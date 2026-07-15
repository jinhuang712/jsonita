import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('ActionButton exposes four glass variants with thin borders', () => {
  const src = read('src/components/ActionButton.tsx');
  assert.match(src, /type ActionButtonVariant = 'primary' \| 'secondary' \| 'danger' \| 'text'/);
  assert.match(src, /jsonita-action-button-\$\{variant\}/);
  const css = read('src/styles/global.css');
  assert.match(css, /\.jsonita-action-button-primary\s*\{[\s\S]*var\(--surface-raised\)[\s\S]*var\(--border-strong\)/);
  assert.match(css, /\.jsonita-action-button-secondary\s*\{[\s\S]*var\(--control-bg\)[\s\S]*var\(--control-border\)/);
  assert.match(css, /\.jsonita-action-button-danger\s*\{[\s\S]*var\(--danger\)/);
  // primary is NOT a solid slab / white text
  assert.doesNotMatch(css, /\.jsonita-action-button-primary\s*\{[^}]*color:\s*#fff/);
});
