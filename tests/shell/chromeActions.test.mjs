import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('split, history, and settings actions live together in the top chrome', () => {
  const tabBar = read('src/shell/TabBar.tsx');
  const statusBar = read('src/shell/StatusBar.tsx');

  assert.match(tabBar, /jsonita-chrome-actions/);
  assert.match(tabBar, /actions\.switchToSinglePanel/);
  assert.match(tabBar, /actions\.openHistory/);
  assert.match(tabBar, /actions\.openSettings/);

  assert.doesNotMatch(statusBar, /actions\.switchToSinglePanel/);
  assert.doesNotMatch(statusBar, /actions\.openHistory/);
});

test('top chrome keeps the decorative brand mark compact beside tool tabs', () => {
  const tabBar = read('src/shell/TabBar.tsx');

  assert.match(tabBar, /aria-hidden="true"/);
  assert.match(tabBar, /width:\s*22,/);
  assert.match(tabBar, /height:\s*22,/);
  assert.match(tabBar, /marginRight:\s*6,/);
  assert.match(tabBar, /WebkitMaskImage:/);
  assert.match(tabBar, /maskImage:/);
});

test('active tab styling keeps tab geometry stable while the pill moves', () => {
  const styles = read('src/styles/global.css');
  const activeRule = styles.match(/\.jsonita-tab-button-active\s*\{([^}]*)\}/)?.[1] ?? '';

  assert.match(styles, /\.jsonita-tab-active-pill\s*\{[\s\S]*transform 180ms/s);
  assert.doesNotMatch(activeRule, /font-weight|font-size|letter-spacing|padding|border/);
});

test('single-pane run affordance sits above the status bar instead of touching bottom chrome', () => {
  const hint = read('src/shell/SinglePaneHint.tsx');

  assert.match(hint, /bottom:\s*44/);
  assert.match(hint, /padding:\s*'6px 10px'/);
	// Uses ShortcutGlyph instead of raw <kbd>
	assert.match(hint, /import \{ ShortcutGlyph \} from '\.\.\/components\/ShortcutGlyph'/);
	assert.match(hint, /<ShortcutGlyph accelerator="CmdOrCtrl\+Enter"/);
	assert.doesNotMatch(hint, /<kbd/);
	assert.doesNotMatch(hint, /formatAccelerator/);
});

test('chrome uses ChromeIconButton with vector-glyph tooltips', () => {
  const tabBar = read('src/shell/TabBar.tsx');

  assert.match(tabBar, /import \{ ChromeIconButton \} from '\.\.\/components\/ChromeIconButton'/);
  assert.match(tabBar, /tooltipShortcut=\{[^}]*shortcutSplitToggle/);
  assert.doesNotMatch(tabBar, /<kbd[^>]*>.*<\/kbd>/);
});

test('chrome hit targets are 34px with no grouping frame', () => {
  const styles = read('src/styles/global.css');

  assert.match(styles, /\.jsonita-chrome-icon-button\s*\{[\s\S]*width:\s*34px/);
  assert.match(styles, /height:\s*34px/);
  assert.doesNotMatch(styles, /\.jsonita-chrome-actions\s*\{[^}]*border:/s);
});

test('split and single view are two separate toggle buttons', () => {
  const tabBar = read('src/shell/TabBar.tsx');

  assert.match(tabBar, /switchToSplitPanel|singlePaneMode === false/);
  assert.match(tabBar, /switchToSinglePanel|singlePaneMode === true/);
  const viewButtons = tabBar.match(/aria-label=\{[^}]*switchTo(Split|Single)Panel[^}]*\}/g) ?? [];
  assert.ok(viewButtons.length >= 2, 'expected split + single toggle buttons');
});

test('ChromeIconButton renders aria-pressed on toggle buttons', () => {
  const source = read('src/components/ChromeIconButton.tsx');
  assert.match(source, /aria-pressed/);
});

test('settings page keeps a close button in the top-right corner', () => {
  const settings = read('src/settings/SettingsView.tsx');

  assert.match(settings, /aria-label=\{t\('actions\.close'\)\}/);
  assert.match(settings, /className="jsonita-page-close"/);
  assert.match(settings, /<ShortcutGlyph accelerator="Escape"[^>]*>/);
  assert.match(settings, /setOpen\(false\)/);
  assert.doesNotMatch(settings, /<kbd[^>]*>Esc<\/kbd>/);
});

test('settings footer commits via ActionButton primitives', () => {
  const settings = read('src/settings/SettingsView.tsx');

  assert.match(settings, /import \{ ActionButton \} from '\.\.\/components\/ActionButton'/);
  assert.match(settings, /<ActionButton[\s\S]*?variant="primary"[\s\S]*?>\s*\{t\('footer\.done'\)\}\s*<\/ActionButton>/);
  assert.match(settings, /<ActionButton[\s\S]*?variant="text"[\s\S]*?>\s*\{t\('footer\.resetAll'\)\}\s*<\/ActionButton>/);
  assert.doesNotMatch(settings, /style=\{btnPrimary\}/);
  assert.doesNotMatch(settings, /style=\{btnGhost\}/);
});

test('settings shortcut rows render matte ShortcutGlyph tiles instead of inline kbd keycaps', () => {
  const settings = read('src/settings/SettingsView.tsx');

  assert.match(settings, /import \{ ShortcutGlyph \} from '\.\.\/components\/ShortcutGlyph'/);
  assert.match(settings, /<ShortcutGlyph[^>]*accelerator=\{accelerator\}/);
  assert.doesNotMatch(settings, /<kbd[^>]*>\{key\}<\/kbd>/);
  assert.doesNotMatch(settings, /keyCapStyle/);
});

test('status bar suppresses invalid json while AI Fix is active', () => {
  const statusBar = read('src/shell/StatusBar.tsx');
  const enShell = read('src/locales/en-US/shell.json');
  const zhShell = read('src/locales/zh-CN/shell.json');

  assert.match(statusBar, /useAiStore\(\(s\) => s\.status\)/);
  assert.match(statusBar, /useUiStore\(\(s\) => s\.activePane\)/);
  assert.match(statusBar, /activePane === 'ai-fix' && aiStatus !== 'idle'/);
  assert.match(statusBar, /statusBar\.aiFixing/);
  assert.match(statusBar, /statusBar\.aiReview/);
  assert.match(enShell, /"aiFixing":\s*"AI Fix in progress"/);
  assert.match(enShell, /"aiReview":\s*"Review AI Fix result"/);
  assert.match(zhShell, /"aiFixing":\s*"AI 修复中"/);
  assert.match(zhShell, /"aiReview":\s*"检查 AI 修复结果"/);
});
