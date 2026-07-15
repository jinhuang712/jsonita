import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

async function loadEscCloseModule() {
  const source = read('src/hooks/escCloseHint.ts');
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
    },
  });
  const url = `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`;
  return import(url);
}

test('Esc close decision ignores blocked or modified Escape events', async () => {
  const { decideEscClose } = await loadEscCloseModule();

  assert.deepEqual(
    decideEscClose({
      isPlainEscape: false,
      isBlocked: false,
      isEditing: false,
      lastNonEditingEscAt: 10,
      now: 20,
    }),
    { action: 'ignore', nextLastEscAt: 10 },
  );

  assert.deepEqual(
    decideEscClose({
      isPlainEscape: true,
      isBlocked: true,
      isEditing: false,
      lastNonEditingEscAt: 10,
      now: 20,
    }),
    { action: 'ignore', nextLastEscAt: 10 },
  );
});

test('editing Escape exits editing and does not seed the double-Esc close window', async () => {
  const { decideEscClose } = await loadEscCloseModule();

  assert.deepEqual(
    decideEscClose({
      isPlainEscape: true,
      isBlocked: false,
      isEditing: true,
      lastNonEditingEscAt: 640,
      now: 700,
    }),
    { action: 'exit-editing', nextLastEscAt: 0 },
  );
});

test('non-editing Escape shows hint first, hides on the second Escape inside the window', async () => {
  const { decideEscClose, DOUBLE_ESC_HIDE_MS } = await loadEscCloseModule();

  assert.deepEqual(
    decideEscClose({
      isPlainEscape: true,
      isBlocked: false,
      isEditing: false,
      lastNonEditingEscAt: 0,
      now: 1000,
    }),
    { action: 'show-hint', nextLastEscAt: 1000 },
  );

  assert.deepEqual(
    decideEscClose({
      isPlainEscape: true,
      isBlocked: false,
      isEditing: false,
      lastNonEditingEscAt: 1000,
      now: 1000 + DOUBLE_ESC_HIDE_MS,
    }),
    { action: 'hide-window', nextLastEscAt: 0 },
  );
});

test('non-editing Escape after the double-Esc window starts a new hint cycle', async () => {
  const { decideEscClose, DOUBLE_ESC_HIDE_MS } = await loadEscCloseModule();

  assert.deepEqual(
    decideEscClose({
      isPlainEscape: true,
      isBlocked: false,
      isEditing: false,
      lastNonEditingEscAt: 1000,
      now: 1000 + DOUBLE_ESC_HIDE_MS + 1,
    }),
    { action: 'show-hint', nextLastEscAt: 1000 + DOUBLE_ESC_HIDE_MS + 1 },
  );
});

test('floating window renders Esc close hint and localizes the prompt', async () => {
  const { ESC_CLOSE_HINT_MS } = await loadEscCloseModule();
  const shell = read('src/shell/FloatingWindow.tsx');
  const store = read('src/store/ui.ts');
  const hotkeys = read('src/hooks/useGlobalHotkeys.ts');
  const styles = read('src/styles/global.css');
  const enShell = read('src/locales/en-US/shell.json');
  const zhShell = read('src/locales/zh-CN/shell.json');

  assert.match(shell, /escCloseHintVisible/);
  assert.match(shell, /escCloseHintRenderKey/);
  assert.match(shell, /function EscCloseHint/);
  assert.match(shell, /<EscCloseHint\s+key=\{escCloseHintRenderKey\}/);
  assert.match(shell, /t\('escCloseHint\.doubleEscToClose'\)/);
  assert.match(store, /escCloseHintRenderKey:\s*number/);
  assert.match(store, /showEscCloseHint:\s*\(\)\s*=>\s*void/);
  assert.match(store, /escCloseHintRenderKey:\s*s\.escCloseHintRenderKey \+ 1/);
  assert.match(hotkeys, /const showEscCloseHint = useUiStore\(\(s\) => s\.showEscCloseHint\)/);
  assert.match(hotkeys, /showEscCloseHint\(\)/);
  assert.match(styles, /\.jsonita-esc-close-hint\b/);
  assert.match(styles, /backdrop-filter:\s*blur\(16px\) saturate\(140%\)/);
  assert.doesNotMatch(styles, /\.jsonita-esc-key\s*\{/);
  assert.match(styles, /jsonita-esc-close-hint-lifecycle 1700ms/);
  assert.doesNotMatch(shell, /x2/);
  assert.match(enShell, /"doubleEscToClose":\s*"Double Esc to close"/);
  assert.match(zhShell, /"doubleEscToClose":\s*"双击 Esc 关闭"/);
  assert.equal(ESC_CLOSE_HINT_MS, 1700);
	// EscCloseHint uses ShortcutGlyph instead of raw <kbd>
	assert.match(shell, /import \{ ShortcutGlyph \} from '\.\.\/components\/ShortcutGlyph'/);
	assert.match(shell, /<ShortcutGlyph accelerator="Escape"/);
	assert.doesNotMatch(shell, /<kbd className="jsonita-esc-key"/);
});

test('global hotkeys keep AI Fix Escape ahead of double-Esc close', () => {
  const hotkeys = read('src/hooks/useGlobalHotkeys.ts');

  assert.match(
    hotkeys,
    /activePane === 'ai-fix' && \(aiStatus === 'awaiting-decision' \|\| aiStatus === 'error'\)/,
  );
  assert.match(hotkeys, /lastExitEscAtRef\.current = 0;\n\s*setEscCloseHintVisible\(false\);\n\s*resetAi\(\)/);
  assert.match(hotkeys, /isBlocked:[\s\S]*activePane === 'ai-fix'/);
  assert.doesNotMatch(hotkeys, /activePane === 'ai-fix' && \(aiStatus === 'awaiting-decision' \|\| aiStatus === 'error'\),/);
});
