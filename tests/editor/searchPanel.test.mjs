import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('cmd-f search panel exposes replace controls but does not restore cmd-r', () => {
  const panel = read('src/editor/searchPanel.ts');
  const keymap = read('src/editor/searchKeymap.ts');

  assert.match(panel, /replaceNext/);
  assert.match(panel, /replaceAll/);
  assert.match(panel, /setAttribute\('data-role', 'replace-input'\)/);
  assert.match(panel, /'replace-next'/);
  assert.match(panel, /'replace-all'/);
  assert.doesNotMatch(keymap, /key:\s*['"]Mod-r['"]/);
});
