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
  assert.match(settings, /background: checked \? 'var\(--toggle-on\)' : 'var\(--control-bg-hover\)'/);
  assert.match(settings, /background: 'var\(--surface-raised\)'/);
  assert.doesNotMatch(settings, /var\(--control-bg-active\)/);
});

test('history and settings are full-window pages with explicit Esc close actions', () => {
  const app = read('src/App.tsx');
  const shell = read('src/shell/FloatingWindow.tsx');
  const history = read('src/history/HistoryModal.tsx');
  const settings = read('src/settings/SettingsView.tsx');
  const styles = read('src/styles/global.css');

  assert.doesNotMatch(app, /<HistoryModal \/>/);
  assert.match(shell, /const historyOpen = useUiStore\(\(s\) => s\.historyModalOpen\)/);
  assert.match(shell, /historyOpen \? \(\s*<HistoryModal \/>/);
  assert.match(history, /className="jsonita-page jsonita-history-page"/);
  assert.match(settings, /className="jsonita-page jsonita-settings-page"/);
  assert.match(history, /className="jsonita-page-close"/);
  assert.match(settings, /className="jsonita-page-close"/);
  assert.match(history, /<kbd[^>]*>Esc<\/kbd>/);
  assert.match(settings, /<kbd[^>]*>Esc<\/kbd>/);
  assert.doesNotMatch(history, /style=\{overlayStyle\}/);
  assert.doesNotMatch(history, /const overlayStyle/);
  assert.match(styles, /\.jsonita-page\b/);
  assert.match(styles, /\.jsonita-page-close\b/);
});

test('history full-window layout keeps the footer pinned to the bottom edge', () => {
  const history = read('src/history/HistoryModal.tsx');

  assert.match(history, /<section className="jsonita-history-shell">/);
  assert.match(history, /<header className="jsonita-history-header">/);
  assert.match(history, /<div className="jsonita-history-toolbar">/);
  assert.match(history, /<div className="jsonita-history-list">/);
  assert.match(history, /<footer className="jsonita-history-footer">/);
  assert.match(history, /<div className="jsonita-history-footer-note">/);
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

test('empty workspace does not render decorative editor watermark overlays', () => {
  const shell = read('src/shell/FloatingWindow.tsx');
  const styles = read('src/styles/global.css');

  assert.match(shell, /function EditorFrame/);
  assert.doesNotMatch(shell, /jsonita-editor-empty-hint/);
  assert.doesNotMatch(shell, /inputEmptyTitle|inputEmptyMeta|outputEmptyTitle|outputEmptyMeta/);
  assert.match(styles, /\.jsonita-pane\b/);
  assert.doesNotMatch(styles, /\.jsonita-editor-empty-hint\b/);
});

test('default typography is large enough for the floating utility chrome', () => {
  const tokens = read('src/styles/tokens.css');
  const uiStore = read('src/store/ui.ts');
  const shell = read('src/shell/FloatingWindow.tsx');

  assert.match(uiStore, /DEFAULT_EDITOR_FONT_SIZE\s*=\s*15/);
  assert.match(tokens, /--fs-xs:\s*12px/);
  assert.match(tokens, /--fs-sm:\s*13\.5px/);
  assert.match(tokens, /--fs-base:\s*14\.5px/);
  assert.match(tokens, /--fs-editor:\s*15px/);
  assert.match(shell, /clamp\(12 \+ chromeFontDelta \* 0\.18,\s*11\.5,\s*13\.2\)/);
  assert.match(shell, /clamp\(13\.5 \+ chromeFontDelta \* 0\.22,\s*12\.5,\s*15\)/);
});

test('dark theme keeps text and controls bright enough to avoid a dull gray UI', () => {
  const tokens = read('src/styles/tokens.css');

  assert.match(tokens, /--text:\s*#F2F4F7/);
  assert.match(tokens, /--text-muted:\s*rgba\(242,\s*244,\s*247,\s*0\.72\)/);
  assert.match(tokens, /--text-faint:\s*rgba\(242,\s*244,\s*247,\s*0\.52\)/);
  assert.match(tokens, /--control-bg-hover:\s*rgba\(255,\s*255,\s*255,\s*0\.12\)/);
  assert.match(tokens, /--glass-bg:\s*rgba\(28,\s*32,\s*40,\s*0\.9\)/);
  assert.match(tokens, /--glass-border:\s*rgba\(255,\s*255,\s*255,\s*0\.2\)/);
  assert.match(tokens, /--primary:\s*#AFC7DE/);
});
