import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('interactive emphasis uses restrained primary values instead of saturated system blue', () => {
  const tokens = read('src/styles/tokens.css');

  assert.doesNotMatch(tokens, /--primary:\s*#0A84FF\b/i);
  assert.doesNotMatch(tokens, /--primary-soft:\s*rgba\(10,\s*132,\s*255,\s*0\.2\)/i);
  assert.match(tokens, /--control-bg:/);
  assert.match(tokens, /--control-bg-hover:/);
  assert.match(tokens, /--control-bg-active:/);
});

test('permission modal uses shared glass tokens and no legacy hardcoded white card', () => {
  const modal = read('src/permissions/ShortcutPermissionModal.tsx');

  assert.doesNotMatch(modal, /background:\s*'#FFFFFF'/);
  assert.doesNotMatch(modal, /background:\s*'#057AF3'/);
  assert.doesNotMatch(modal, />⌨️</);
  assert.match(modal, /var\(--bg-elevated\)/);
  assert.match(modal, /var\(--primary\)/);
});

test('history and settings use shared quiet surface tokens for controls', () => {
  const history = read('src/history/HistoryModal.tsx');
  const settings = read('src/settings/SettingsView.tsx');

  assert.match(history, /var\(--control-bg\)/);
  assert.match(history, /var\(--control-bg-active\)/);
  assert.match(settings, /var\(--control-bg\)/);
  assert.match(settings, /var\(--control-bg-active\)/);
});

test('native polish separates UI, code, and shortcut typography', () => {
  const tokens = read('src/styles/tokens.css');
  const statusBar = read('src/shell/StatusBar.tsx');
  const editorTheme = read('src/editor/theme.ts');

  assert.match(tokens, /--font-ui:/);
  assert.match(tokens, /--font-code:/);
  assert.match(tokens, /--font-mono-ui:/);
  assert.match(statusBar, /fontFamily:\s*'var\(--font-ui\)'/);
  assert.match(editorTheme, /fontFamily:\s*'var\(--font-code\)'/);
});

test('empty workspace uses editor overlays instead of leaving a blank glass void', () => {
  const shell = read('src/shell/FloatingWindow.tsx');
  const styles = read('src/styles/global.css');

  assert.match(shell, /function EditorFrame/);
  assert.match(shell, /jsonita-editor-empty-hint/);
  assert.match(styles, /\.jsonita-pane\b/);
  assert.match(styles, /\.jsonita-editor-empty-hint\b/);
});
