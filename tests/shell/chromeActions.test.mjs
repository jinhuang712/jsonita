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

test('single-pane run affordance sits above the status bar instead of touching bottom chrome', () => {
  const hint = read('src/shell/SinglePaneHint.tsx');

  assert.match(hint, /bottom:\s*44/);
  assert.match(hint, /padding:\s*'6px 10px'/);
});

test('top chrome action icons have visible independent hit targets without a grouping frame', () => {
  const styles = read('src/styles/global.css');

  assert.match(styles, /\.jsonita-chrome-actions\b/);
  assert.match(styles, /\.jsonita-chrome-actions\s+\.jsonita-chrome-icon-button\b/);
  assert.match(styles, /width:\s*30px/);
  assert.match(styles, /height:\s*28px/);
  assert.doesNotMatch(styles, /\.jsonita-chrome-actions\s*\{[^}]*border:/s);
  assert.doesNotMatch(styles, /\.jsonita-chrome-actions\s*\{[^}]*background:/s);
});

test('settings page keeps a close button in the top-right corner', () => {
  const settings = read('src/settings/SettingsView.tsx');

  assert.match(settings, /aria-label=\{t\('actions\.close'\)\}/);
  assert.match(settings, /className="jsonita-page-close"/);
  assert.match(settings, /<kbd[^>]*>Esc<\/kbd>/);
  assert.match(settings, /setOpen\(false\)/);
});

test('top chrome icon actions use app-rendered tooltips with labels and shortcuts', () => {
  const tabBar = read('src/shell/TabBar.tsx');
  const styles = read('src/styles/global.css');
  const enShell = read('src/locales/en-US/shell.json');
  const zhShell = read('src/locales/zh-CN/shell.json');

  assert.match(tabBar, /type ChromeActionTooltip/);
  assert.match(tabBar, /tooltipLabel=/);
  assert.match(tabBar, /tooltipShortcut=\{formatAccelerator\(settings\.shortcutSplitToggle\)\}/);
  assert.match(tabBar, /tooltipShortcut=\{formatAccelerator\('CmdOrCtrl\+Y'\)\}/);
  assert.match(tabBar, /tooltipShortcut=\{formatAccelerator\('CmdOrCtrl\+,'\)\}/);
  assert.match(tabBar, /className="jsonita-chrome-tooltip"/);
  assert.doesNotMatch(tabBar, /title=\{`\$\{/);
  assert.match(styles, /\.jsonita-chrome-icon-button:hover\s+\.jsonita-chrome-tooltip/);
  assert.match(styles, /right:\s*0/);
  assert.match(styles, /transform:\s*translateY\(-3px\)/);
  assert.match(styles, /\.jsonita-chrome-tooltip-shortcut/);
  assert.match(enShell, /"settings":\s*"Settings"/);
  assert.match(zhShell, /"settings":\s*"设置"/);
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
