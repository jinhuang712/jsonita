import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../../', import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), 'utf8');
}

test('history library separates a dense JSON rail from the selected document preview', () => {
  const modal = read('src/history/HistoryModal.tsx');
  const rail = read('src/history/HistoryDocumentList.tsx');
  const preview = read('src/history/HistoryDocumentPreview.tsx');
  const styles = read('src/styles/global.css');

  assert.match(modal, /className="jsonita-history-library"/);
  assert.match(rail, /className="jsonita-history-document-list"/);
  assert.match(preview, /className="jsonita-history-preview"/);
  assert.match(styles, /grid-template-columns:\s*minmax\(0,\s*53fr\)\s+minmax\(0,\s*47fr\)/);
  assert.match(styles, /\.jsonita-history-document-row\s*\{[^}]*height:\s*42px/s);
  assert.doesNotMatch(rail, /row\.summary/);
  assert.doesNotMatch(rail, /opType/);
  assert.doesNotMatch(modal, /function opMeta/);
});

test('history opens only the selected JSON from its primary action and keyboard shortcut', () => {
  const modal = read('src/history/HistoryModal.tsx');
  const preview = read('src/history/HistoryDocumentPreview.tsx');

  assert.match(modal, /const \[selectedId, setSelectedId\] = useState<number \| null>\(null\)/);
  assert.match(modal, /event\.key === 'Enter'/);
  assert.match(modal, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(modal, /applyRow\(selectedRow\)/);
  assert.match(preview, /<ShortcutGlyph[^>]*accelerator="CmdOrCtrl\+Enter"/);
  assert.match(preview, /<ActionButton[\s\S]*?variant="secondary"[\s\S]*?onClick=\{onOpen\}/);
  assert.doesNotMatch(preview, /<kbd/);
  assert.doesNotMatch(preview, /formatAccelerator/);
});

test('history keeps star as the sole quiet selected-document keep action with a shared SVG marker', () => {
  const rail = read('src/history/HistoryDocumentList.tsx');
  const preview = read('src/history/HistoryDocumentPreview.tsx');
  const icons = read('src/components/icons.tsx');
  const en = read('src/locales/en-US/history.json');
  const zh = read('src/locales/zh-CN/history.json');

  // Pin folded into star: star (收藏) both keeps from clear and floats to top.
  assert.match(icons, /export function StarIcon/);
  assert.doesNotMatch(icons, /export function PinIcon/);
  assert.match(rail, /<StarIcon width=\{12\}/);
  assert.doesNotMatch(rail, /PinIcon/);
  assert.doesNotMatch(rail, />⌖</);
  assert.match(preview, /onStar/);
  assert.doesNotMatch(preview, /onPin/);
  assert.match(preview, /<ActionButton[\s\S]*?variant="secondary"[\s\S]*?aria-pressed=\{row\.starred\}/);
  assert.doesNotMatch(preview, /aria-pressed=\{row\.pinned\}/);
  assert.match(en, /"openInEditor"/);
  assert.match(zh, /"openInEditor"/);
  assert.doesNotMatch(en, /"pin"/);
  assert.doesNotMatch(zh, /"pin"/);
});

test('history retains the selected id across reloads and routes mutations through the existing IPC API', () => {
  const modal = read('src/history/HistoryModal.tsx');

  assert.match(modal, /const selectedRow = useMemo\(/);
  assert.match(modal, /rows\.find\(\(row\) => row\.id === selectedId\)/);
  assert.match(modal, /setSelectedId\(rows\[0\]\?\.id \?\? null\)/);
  assert.match(modal, /await historyApi\.star\(row\.id, !row\.starred\)/);
  assert.doesNotMatch(modal, /historyApi\.pin\(/);
  assert.match(modal, /await historyApi\.clear\(\)/);
  assert.doesNotMatch(modal, /type Filter/);
  assert.doesNotMatch(modal, /applyFilter\(/);
});
