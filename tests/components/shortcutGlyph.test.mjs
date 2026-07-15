import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('ShortcutGlyph renders accelerator as adjacent matte tiles', () => {
  const src = read('src/components/ShortcutGlyph.tsx');
  assert.match(src, /import \{ shortcutTiles \} from '\.\.\/keyboard\/accelerators'/);
  assert.match(src, /className=\{`jsonita-shortcut-glyph/);
  assert.match(src, /href=\{`#\$\{/); // href={`#${tile.glyph}`}
});

test('matte keycap CSS uses SF Pro, thin border, and flat dark tiles', () => {
  const css = read('src/styles/global.css');
  assert.match(css, /\.jsonita-shortcut-tile\s*\{[\s\S]*var\(--font-ui\)[\s\S]*\}/);
  assert.match(css, /\.jsonita-shortcut-tile\s*\{[\s\S]*1px solid var\(--kbd-border\)/);
  // dark keycap is flat, not a gradient
  assert.doesNotMatch(css, /\[data-theme="dark"\][\s\S]*?--kbd-bg:\s*linear-gradient/);
});
