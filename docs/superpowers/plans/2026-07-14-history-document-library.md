# History Document Library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the trace-like History list with the approved B2 local JSON library: a dense 53/47 list-and-preview page with selected-document Pin/Star actions and `CmdOrCtrl+Enter` editor hand-off.

**Architecture:** `HistoryModal` stays the only stateful History boundary and keeps existing Tauri commands. It composes props-only `HistoryDocumentList` and `HistoryDocumentPreview` components, with formatting in `historyPresentation.ts`; CSS provides the Quiet Glass layout and existing SVG icons provide consistent Pin/Star status.

**Tech Stack:** React 18, TypeScript, Zustand, react-i18next, Tauri IPC, CSS custom properties, Node built-in test runner, Vite.

## Global Constraints

- Preserve the existing SQLite schema, `HistoryRow`, `history.list/search/pin/star/clear` commands, and clear-protection behaviour for both pinned and starred rows.
- The default History content split is `minmax(0, 53fr) minmax(0, 47fr)`; rail rows are 42px one-line excerpts.
- Do not render operation-type chips, `row.summary`, derived JSON titles, per-row action buttons, or text-glyph pin markers.
- Pin and Star are selected-document controls; rail state uses 12px `PinIcon` / `StarIcon` SVGs only.
- Localize all new user-facing History copy in English and Simplified Chinese.
- Preserve unrelated dirty files in the original checkout; work only in `/Users/jin.huang/.config/superpowers/worktrees/jsonita/history-document-library`.
- Do not install additional dependencies.

---

### Task 1: Lock the approved document-library contract with failing tests

**Files:**

- Create: `tests/history/historyLibrary.test.mjs`
- Modify: `tests/design/nativeQuietGlass.test.mjs`

**Interfaces:**

- Consumes: source text from `src/history/HistoryModal.tsx`, the new History presentation files, `src/components/icons.tsx`, `src/styles/global.css`, and both History locale files.
- Produces: regression coverage for the two-column library shell, quiet action placement, icon contract, and keyboard hand-off before production code exists.

- [x] **Step 1: Write the failing History source-contract tests**

Create `tests/history/historyLibrary.test.mjs` using the repository's normal
`node:test` + `readFileSync` helpers. Add these three tests exactly:

```js
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
  assert.match(preview, /formatAccelerator\('CmdOrCtrl\+Enter'\)/);
  assert.match(preview, /<kbd[^>]*>\{formatAccelerator\('CmdOrCtrl\+Enter'\)\}<\/kbd>/);
});

test('history keeps pin and star as quiet selected-document actions with shared SVG state markers', () => {
  const rail = read('src/history/HistoryDocumentList.tsx');
  const preview = read('src/history/HistoryDocumentPreview.tsx');
  const icons = read('src/components/icons.tsx');
  const en = read('src/locales/en-US/history.json');
  const zh = read('src/locales/zh-CN/history.json');

  assert.match(icons, /export function PinIcon/);
  assert.match(icons, /export function StarIcon/);
  assert.match(rail, /<PinIcon width=\{12\}/);
  assert.match(rail, /<StarIcon width=\{12\}/);
  assert.doesNotMatch(rail, />⌖</);
  assert.match(preview, /onPin/);
  assert.match(preview, /onStar/);
  assert.match(en, /"openInEditor"/);
  assert.match(zh, /"openInEditor"/);
});
```

In the existing `history and settings use shared quiet surface tokens for
controls` test in `tests/design/nativeQuietGlass.test.mjs`, first read the CSS
alongside the existing History and Settings source:

```js
const styles = read('src/styles/global.css');
```

Then add these assertions:

```js
assert.match(styles, /\.jsonita-history-preview-action\s*\{[^}]*background:\s*var\(--surface-raised\)/s);
assert.doesNotMatch(history, /<span style=\{\{ \.\.\.chipStyle/);
```

- [x] **Step 2: Run the tests to verify the red state**

Run:

```bash
node --test tests/history/historyLibrary.test.mjs tests/design/nativeQuietGlass.test.mjs
```

Expected: FAIL because the presentation files and shared `PinIcon`/`StarIcon`
do not exist, and `HistoryModal` still renders chips plus per-row actions.

### Task 2: Build the stateless document rail and selected-preview components

**Files:**

- Create: `src/history/historyPresentation.ts`
- Create: `src/history/HistoryDocumentList.tsx`
- Create: `src/history/HistoryDocumentPreview.tsx`
- Modify: `src/components/icons.tsx`
- Modify: `src/locales/en-US/history.json`
- Modify: `src/locales/zh-CN/history.json`
- Modify: `src/styles/global.css`

**Interfaces:**

- Consumes: `HistoryRow` from `src/types/commands.ts`, `formatAccelerator` from `src/keyboard/accelerators.ts`, and `PinIcon` / `StarIcon` from `src/components/icons.tsx`.
- Produces: `compactJson`, `formatHistoryBytes`, `formatHistoryDate`, `HistoryDocumentList`, and `HistoryDocumentPreview`, all free of Tauri IPC and Zustand reads.

- [x] **Step 1: Add the pure presentation helpers**

Create `src/history/historyPresentation.ts` with these exported functions:

```ts
export function compactJson(content: string, limit = 96): string {
  const compact = content.trim().replace(/\s+/g, ' ');
  return compact.length > limit ? `${compact.slice(0, limit - 1)}…` : compact;
}

export function formatHistoryBytes(content: string): string {
  const bytes = new TextEncoder().encode(content).byteLength;
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
}

export function formatHistoryDate(createdAt: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(createdAt));
}
```

- [x] **Step 2: Add consistent icon primitives**

Append these two icons to `src/components/icons.tsx`; both must inherit the
existing `IconProps` defaults:

```tsx
export function PinIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M8 4h8M9.5 4l.7 6-3.2 3.2v1.3h10v-1.3L13.8 10l.7-6M12 14.5V21" />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}
```

- [x] **Step 3: Create the props-only rail and preview**

Create `HistoryDocumentList.tsx` with props
`rows`, `selectedId`, `locale`, and `onSelect`. Each row is a button using
`compactJson(row.content)`, `formatHistoryDate`, and `formatHistoryBytes`.
It adds 12px `PinIcon` and `StarIcon` only when their row metadata is true.

Create `HistoryDocumentPreview.tsx` with props
`row`, `locale`, `onOpen`, `onPin`, `onStar`, and `t`. It renders an empty
preview when `row` is null; otherwise it renders metadata, Pin and Star
buttons with `aria-pressed`, the raw `row.content` in `<pre>`, and this sole
editor hand-off action:

```tsx
<button type="button" className="jsonita-history-preview-action" onClick={onOpen}>
  <kbd>{formatAccelerator('CmdOrCtrl+Enter')}</kbd>
  <span>{t('actions.openInEditor')}</span>
</button>
```

- [x] **Step 4: Add the library CSS and localized copy**

Replace the old toolbar/list-only History styles in `src/styles/global.css`
with a `.jsonita-history-library` grid. Use the following required selectors
and values:

```css
.jsonita-history-library {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 53fr) minmax(0, 47fr);
}
.jsonita-history-document-row { height: 42px; }
.jsonita-history-preview { min-width: 0; padding: 18px 24px; }
.jsonita-history-preview-action { background: var(--surface-raised); }
```

Use `--control-bg`, `--control-border`, `--primary-edge`, `--primary-soft`,
`--font-code`, and existing focus tokens. Do not add hard-coded colours.

Add `openInEditor`, `pin`, `unpin`, `star`, `unstar`, `emptyPreview`, and a
footer message explaining that pinned and starred JSON survives Clear to both
History locale files.

- [x] **Step 5: Run the presentation-only contract to verify green code**

Run:

```bash
node --test --test-name-pattern "history keeps pin and star" tests/history/historyLibrary.test.mjs
```

Expected: the Pin/Star presentation contract passes. The modal and native
Quiet Glass assertions remain red until Task 3 replaces the old log-list
orchestration.

### Task 3: Make `HistoryModal` the selected-document orchestrator

**Files:**

- Modify: `src/history/HistoryModal.tsx`
- Modify: `tests/history/historyLibrary.test.mjs`

**Interfaces:**

- Consumes: `HistoryDocumentList`, `HistoryDocumentPreview`, existing
`historyApi`, `useEditorStore`, and `useUiStore`.
- Produces: selected-row retention, query loading, Pin/Star/clear mutations,
and a History-local `CmdOrCtrl+Enter` action without altering the backend.

- [x] **Step 1: Extend the failing test for state retention and mutation reloads**

Append this test before modifying the modal:

```js
test('history retains the selected id across reloads and routes mutations through the existing IPC API', () => {
  const modal = read('src/history/HistoryModal.tsx');

  assert.match(modal, /const selectedRow = useMemo\(/);
  assert.match(modal, /rows\.find\(\(row\) => row\.id === selectedId\)/);
  assert.match(modal, /setSelectedId\(rows\[0\]\?\.id \?\? null\)/);
  assert.match(modal, /await historyApi\.pin\(row\.id, !row\.pinned\)/);
  assert.match(modal, /await historyApi\.star\(row\.id, !row\.starred\)/);
  assert.match(modal, /await historyApi\.clear\(\)/);
  assert.doesNotMatch(modal, /type Filter/);
  assert.doesNotMatch(modal, /applyFilter\(/);
});
```

- [x] **Step 2: Run the new modal test to verify it fails**

Run:

```bash
node --test tests/history/historyLibrary.test.mjs
```

Expected: FAIL because the old modal owns a `Filter`, opens rows immediately,
and has no `selectedId` or selected-preview composition.

- [x] **Step 3: Replace the log-list orchestration**

In `HistoryModal.tsx`:

1. Remove `Filter`, `filter`, `applyFilter`, `HistoryItem`, `opMeta`, all
   inline item/filter/action style constants, and the full-width toolbar.
2. Add `selectedId` state and compute the preview row with:

```ts
const selectedRow = useMemo(
  () => rows.find((row) => row.id === selectedId) ?? rows[0] ?? null,
  [rows, selectedId],
);

useEffect(() => {
  setSelectedId((current) => (rows.some((row) => row.id === current) ? current : (rows[0]?.id ?? null)));
}, [rows]);
```

3. Keep query loading on the existing `historyApi.search(q, LIST_LIMIT)` and
   `historyApi.list({ limit: LIST_LIMIT, offset: 0 })` commands only.
4. Render the search and `HistoryDocumentList` inside the left rail, and
   render `HistoryDocumentPreview` on the right. Row click calls
   `setSelectedId(row.id)`; only the preview's open action calls
   `setContent(row.content)` and `setOpen(false)`.
5. Add a capturing `keydown` effect. On `event.key === 'Enter'`,
   `(event.metaKey || event.ctrlKey)`, and no `Alt` or `Shift`, call
   `event.preventDefault()` and `applyRow(selectedRow)`. Keep the existing
   plain-Escape close effect unchanged. Do not import the hook-local
   `hasPrimaryModifier` helper from `useGlobalHotkeys.ts`.
6. Route Pin, Star, and Clear through their existing IPC calls, reload on
   success, and put an IPC failure into the existing `error` state.

- [x] **Step 4: Verify the History tests are green**

Run:

```bash
node --test tests/history/historyLibrary.test.mjs tests/design/nativeQuietGlass.test.mjs
pnpm tsc --noEmit
```

Expected: all selected History/design tests pass and TypeScript reports no
errors.

### Task 4: Synchronize the visual source of truth, documentation, and release evidence

**Files:**

- Modify: `design/prototype/index.html`
- Modify: `design/02_interaction.md`
- Modify: `design/04_components.md`
- Modify: `CHANGELIST.md`
- Modify: `tests/design/prototypeReference.test.mjs`

**Interfaces:**

- Consumes: the approved B2 layout and
  `docs/superpowers/specs/2026-07-14-history-document-library-design.md`.
- Produces: a high-fidelity History reference branch, durable interaction and
  component contracts, and a changelist entry that distinguishes the visual
  redesign from storage semantics.

- [x] **Step 1: Write the failing prototype reference assertion**

Append this test to `tests/design/prototypeReference.test.mjs`:

```js
test('history prototype documents the dense library and selected-document pin interaction', () => {
  const html = read('design/prototype/index.html');

  assert.match(html, /History \(32\)/);
  assert.match(html, /Search JSON/);
  assert.match(html, /Open in editor/);
  assert.match(html, /Pinned JSON stays when clearing/);
  assert.doesNotMatch(html, /Pinned production payload/);
  assert.doesNotMatch(html, /Webhook payload/);
});
```

- [x] **Step 2: Update the high-fidelity History branch**

Replace `renderHistory()` in `design/prototype/index.html` so the populated
branch mirrors the application contract: `History (32)`, a 53/47 list/preview,
one-line JSON excerpts with date/size, an SVG Pin state marker, selected
document Pin/Star controls, and a bottom-right `⌘↵ Open in editor` button.
Keep the current empty/search/no-results state matrix but remove mock titles,
operation labels, and trace prose.

- [x] **Step 3: Update design prose and durable history**

Replace the History subsection in `design/02_interaction.md` with the
left-rail/right-preview interaction, select-versus-open distinction,
`CmdOrCtrl+Enter`, and Pin/Star preservation rules. Add `HistoryDocumentList`
and `HistoryDocumentPreview` to `design/04_components.md` as props-only
presentation components, and record their 42px / 53:47 visual contract.

Add a top `### feat · History 收敛为本地 JSON 文档库` section to
`CHANGELIST.md` using the existing three-row table. State explicitly that no
SQLite schema or IPC contract changed and link the change to the approved B2
feedback.

- [x] **Step 4: Run complete verification and local visual validation**

Run:

```bash
pnpm test:node
pnpm tsc --noEmit
pnpm build
git diff --check
diff -u AGENTS.md CLAUDE.md
pnpm deploy:local:macos
```

Expected: 47 or more Node tests pass, type checking and production build exit
zero, both diff commands are silent, and the local `Jsonita.app` rebuilds from
this branch. Inspect History with populated local data and confirm: compact
rail, wider left column, selected preview, Pin toggle, no operation chips, and
the shortcut only in the bottom editor action.

Implementation note (2026-07-14): the Node suite passed 51 tests, `pnpm build`
and the local macOS deployment completed, and `/Applications/Jsonita.app`
launched. The Computer Use accessibility reader timed out twice against that
menu-bar app, so a post-install populated-history visual inspection remains
blocked by the local UI automation service rather than being recorded as passed.

- [x] **Step 5: Commit the complete feature**

Run:

```bash
git add src/history src/components/icons.tsx src/styles/global.css src/locales/en-US/history.json src/locales/zh-CN/history.json tests/history/historyLibrary.test.mjs tests/design/nativeQuietGlass.test.mjs tests/design/prototypeReference.test.mjs design/prototype/index.html design/02_interaction.md design/04_components.md CHANGELIST.md docs/superpowers/specs/2026-07-14-history-document-library-design.md docs/superpowers/plans/2026-07-14-history-document-library.md
git commit -m "feat(history): add JSON document library"
```
