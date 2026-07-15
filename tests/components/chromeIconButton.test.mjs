import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('ChromeIconButton renders a 34px glass icon action with ShortcutGlyph tooltip', () => {
  const src = read('src/components/ChromeIconButton.tsx');
  assert.match(src, /import \{ ShortcutGlyph \} from '\.\/ShortcutGlyph'/);
  assert.match(src, /className=\{`jsonita-chrome-icon-button/);
  assert.match(src, /tooltipShortcut && <ShortcutGlyph/);
  const css = read('src/styles/global.css');
  assert.match(css, /\.jsonita-chrome-icon-button\s*\{[\s\S]*width:\s*34px[\s\S]*height:\s*34px/);
});
