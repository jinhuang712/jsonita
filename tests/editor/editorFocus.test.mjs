import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('showing the window returns keyboard focus to the input editor', () => {
  const editor = read('src/editor/Editor.tsx');
  const floatingWindow = read('src/shell/FloatingWindow.tsx');

  assert.match(editor, /focusOnWindowShown/);
  assert.match(editor, /on\('window:shown'/);
  assert.match(editor, /requestAnimationFrame/);
  assert.match(editor, /viewRef\.current\?\.focus\(\)/);
  assert.match(floatingWindow, /<Editor\s+focusOnWindowShown\s+theme=/);
});
