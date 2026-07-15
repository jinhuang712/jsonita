import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('AiFixPane review actions use ActionButton with correct glass variants', () => {
  const src = read('src/panes/AiFixPane.tsx');
  // imports ActionButton
  assert.match(src, /import \{ ActionButton \} from '\.\.\/components\/ActionButton'/);
  // Accept button uses variant="primary"
  assert.match(src, /variant="primary"/);
  // Reject/Cancel buttons use variant="secondary"
  // Match at least one secondary variant usage (the Cancel button)
  assert.match(src, /variant="secondary"/);
  // No more inline btnGhost / btnPrimary style objects
  assert.doesNotMatch(src, /const btnGhost/);
  assert.doesNotMatch(src, /const btnPrimary/);
  // No more inline kbdStyle
  assert.doesNotMatch(src, /const kbdStyle/);
});

test('Accept shortcut uses ShortcutGlyph', () => {
  const src = read('src/panes/AiFixPane.tsx');
  assert.match(src, /import \{ ShortcutGlyph \} from '\.\.\/components\/ShortcutGlyph'/);
  assert.match(src, /ShortcutGlyph/);
  // uses accelerator="Cmd+Enter" or similar
  assert.match(src, /accelerator=.*Cmd.*Enter/);
});