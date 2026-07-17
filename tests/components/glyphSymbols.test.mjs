import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('GlyphSymbols declares the vector glyph set with verified paths', () => {
  const src = read('src/components/GlyphSymbols.tsx');
  assert.match(src, /id="g-cmd"/);
  assert.match(src, /id="g-shift"/);
  assert.match(src, /id="g-return"/);
  // ⌘ = Apple Bowen-knot path (viewBox 64)
  assert.match(src, /viewBox="0 0 64 64"[^>]*fill="none"[^>]*stroke="currentColor"/);
  // no raw unicode ⌘/⇧/↵ characters used as glyphs
  assert.doesNotMatch(src, /[⌘⇧↵]/);
});

test('App mounts GlyphSymbols exactly once', () => {
  const app = read('src/App.tsx');
  assert.match(app, /<GlyphSymbols/);
});

test('shortcutTiles maps mac modifiers to glyph ids', () => {
  const src = read('src/keyboard/accelerators.ts');
  assert.match(src, /export type ShortcutTile/);
  assert.match(src, /'cmdorctrl'|'cmd':\s*\{[^}]*g-cmd/);
  assert.match(src, /'shift':\s*\{[^}]*g-shift/);
  assert.match(src, /'enter'|'return':\s*\{[^}]*g-return/);
  assert.match(src, /'escape':\s*\{[^}]*text:\s*'esc'/);
});
