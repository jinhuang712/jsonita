import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('AiFixPane review actions use ActionButton with correct glass variants', () => {
  const src = read('src/panes/AiFixPane.tsx');
  // imports ActionButton
  assert.match(src, /import \{ ActionButton \} from '\.\.\/components\/ActionButton'/);
  // Accept button uses variant="primary" with CmdOrCtrl+Enter shortcut
  assert.match(src, /variant="primary"/);
  // Accept button must carry CmdOrCtrl+Enter accelerator
  assert.match(src, /accelerator="CmdOrCtrl\+Enter"/);
  // Reject/Cancel/Close buttons all use variant="secondary" (at least 2 occurrences)
  const secondaryMatches = src.match(/variant="secondary"/g) ?? [];
  assert.ok(secondaryMatches.length >= 2, 'expected at least 2 secondary ActionButtons (Close + Cancel)');
  // No more inline btnGhost / btnPrimary style objects
  assert.doesNotMatch(src, /const btnGhost/);
  assert.doesNotMatch(src, /const btnPrimary/);
  // No more inline kbdStyle
  assert.doesNotMatch(src, /const kbdStyle/);
});

test('Accept shortcut uses ShortcutGlyph with CmdOrCtrl+Enter', () => {
  const src = read('src/panes/AiFixPane.tsx');
  assert.match(src, /import \{ ShortcutGlyph \} from '\.\.\/components\/ShortcutGlyph'/);
  assert.match(src, /ShortcutGlyph/);
  // uses accelerator="CmdOrCtrl+Enter"
  assert.match(src, /accelerator="CmdOrCtrl\+Enter"/);
});
