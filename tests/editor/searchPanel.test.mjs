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

test('cmd-f search panel defaults regexp on while keeping the regexp toggle reversible', () => {
  const panel = read('src/editor/searchPanel.ts');
  const extensions = read('src/editor/extensions.ts');

  assert.match(extensions, /search\(\{\s*top:\s*true,[^}]*regexp:\s*true/s);
  assert.match(panel, /key === 'regexp'\s*\?\s*!this\.query\.regexp\s*:\s*this\.query\.regexp/);
  assert.match(panel, /this\.regexpButton\.setAttribute\('aria-pressed', String\(this\.query\.regexp\)\)/);
});

test('replace row keeps its regexp toggle independent from find regexp state', () => {
  const panel = read('src/editor/searchPanel.ts');
  const theme = read('src/editor/theme.ts');

  assert.match(panel, /private replaceRegexp = true/);
  assert.match(panel, /replaceRegexpButton = iconButton\('\.\*', t\('actions\.replaceRegexp'\)/);
  assert.match(panel, /this\.replaceRegexpButton/);
  assert.doesNotMatch(panel, /toggleReplace/);
  assert.doesNotMatch(panel, /replaceOpen/);
  assert.match(panel, /this\.replaceRegexpButton\.classList\.toggle\('jsonita-search-toggle-active', this\.replaceRegexp\)/);
  assert.match(panel, /this\.replaceRegexpButton\.setAttribute\('aria-pressed', String\(this\.replaceRegexp\)\)/);
  assert.match(panel, /'jsonita-search-replace-action jsonita-search-replace-current'/);
  assert.match(panel, /'jsonita-search-replace-action jsonita-search-replace-all'/);
  assert.doesNotMatch(panel, /jsonita-search-replace-primary/);
  assert.doesNotMatch(panel, /jsonita-search-replace-secondary/);
  assert.match(theme, /'\.jsonita-search-replace-action':\s*\{/);
  assert.match(theme, /'\.jsonita-search-replace-action':\s*\{[^}]*borderColor:\s*'var\(--control-border\)'/s);
  assert.match(theme, /'\.jsonita-search-replace-action':\s*\{[^}]*backgroundColor:\s*'var\(--control-bg\)'/s);
  assert.match(theme, /'\.jsonita-search-replace-action':\s*\{[^}]*color:\s*'var\(--text\)'/s);
  assert.doesNotMatch(theme, /'\.jsonita-search-replace-action':\s*\{[^}]*backgroundColor:\s*'var\(--control-bg-active\)'/s);
  assert.match(theme, /'\.jsonita-search-replace-action:hover':\s*\{/);
  assert.match(theme, /'\.jsonita-search-replace-action:hover':\s*\{[^}]*borderColor:\s*'var\(--primary-edge\)'/s);
});

test('replace actions avoid accent-filled or transparent-text styling', () => {
  const theme = read('src/editor/theme.ts');

  assert.doesNotMatch(theme, /jsonita-search-replace-primary/);
  assert.doesNotMatch(theme, /backgroundColor:\s*'var\(--accent\)'/);
  assert.doesNotMatch(theme, /color:\s*'var\(--bg\)'/);
});
