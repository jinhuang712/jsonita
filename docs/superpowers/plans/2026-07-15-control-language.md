# Control Language Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every button, shortcut keycap, and setting control across all Jsonita surfaces with one glass-and-matte-tile control language, using four new primitives (`GlyphSymbols`, `ShortcutGlyph`, `ActionButton`, `ChromeIconButton`) and a vector glyph set.

**Architecture:** New presentational primitives in `src/components/` own the control language; existing feature components (TabBar, Settings, History, AiFix, ShortcutPermissionModal, SinglePaneHint, FloatingWindow) swap their inline buttons/`<kbd>`/`formatAccelerator`-string displays for these primitives. CSS lives in `src/styles/global.css` as `jsonita-` BEM classes whose exact values are copied from `design/prototype/controls.html` (the specimen is the visual source of truth). Shortcut *display* moves from a `formatAccelerator` string inside `<kbd>` to `ShortcutGlyph` tiles; `formatAccelerator` is kept only for accessible labels / text-only contexts.

**Tech Stack:** React 18 + TypeScript, Vite, Zustand, i18next, Tauri 2. Tests: Node's built-in runner (`node --test tests/**/*.test.mjs`) using **source-string assertions** (`assert.match` on `.tsx`/`.css` file contents) — they do not render components.

## Global Constraints

- macOS-only product; `node >= 20`, `pnpm >= 9`; package manager `pnpm@9.12.0`.
- Repo is outside the internal `~/dev/repository` root → use **direct `git -C <repo>`** (not `ym`); commit identity is GitHub `jinhuang712`.
- Tests assert on source text — any changed class/value/selectors must update the corresponding `tests/**/*.test.mjs`.
- Never log JSON document content or API keys; API key storage stays `secrets.json` (no Keychain).
- Version markers stay aligned (`package.json`, `src-tauri/Cargo.toml`, `tauri.conf.json`, About). This change touches none of them — do not bump.
- Out of scope: command palette / ⌘K, transform-tab geometry, editor layout, token/theme redesign.
- Visual source of truth: `design/prototype/controls.html`. Copy exact CSS values from there; do not improvise.

---

## File Structure

**Create:**
- `src/components/GlyphSymbols.tsx` — hidden `<svg>` declaring the ⌘⇧↑↓↵ `<symbol>` set; mounted once in `App.tsx`.
- `src/components/ShortcutGlyph.tsx` — render an accelerator as adjacent matte keycap tiles.
- `src/components/ActionButton.tsx` — glass commit button (`primary` | `secondary` | `danger` | `text`).
- `src/components/ChromeIconButton.tsx` — 34px chrome icon action + tooltip (extracted from `TabBar`).
- `tests/components/shortcutGlyph.test.mjs`, `tests/components/actionButton.test.mjs`, `tests/components/chromeIconButton.test.mjs`, `tests/components/glyphSymbols.test.mjs`.

**Modify:**
- `src/keyboard/accelerators.ts` — add `shortcutTiles(accelerator)` + `ShortcutTile` type (no change to existing `formatAccelerator`).
- `src/styles/global.css` — add new `jsonita-shortcut-glyph`, `jsonita-action-button`, `jsonita-chrome-icon-button` (revised), matte-keycap rules; flatten dark gradients; switch keycap font to `--font-ui`; remove obsolete `jsonita-esc-key*` / old `kbd` rules after migration.
- `src/styles/tokens.css` — no new tokens required (specimen reuses existing `--surface-raised`, `--control-bg`, `--border-strong`, etc.). Remove now-unused `--commit`/`--commit-hover` only if nothing references them after migration (verify with grep first).
- `src/App.tsx` — mount `<GlyphSymbols />` once.
- `src/shell/TabBar.tsx`, `src/shell/FloatingWindow.tsx`, `src/shell/SinglePaneHint.tsx`, `src/settings/SettingsView.tsx`, `src/settings/ShortcutInput.tsx`, `src/permissions/ShortcutPermissionModal.tsx`, `src/history/HistoryModal.tsx` (+ `HistoryDocumentPreview.tsx`), `src/panes/AiFixPane.tsx` — swap to primitives.
- `tests/shell/chromeActions.test.mjs`, `tests/shell/escCloseHint.test.mjs`, `tests/settings/*.test.mjs`, `tests/history/historyLibrary.test.mjs`, `tests/design/nativeQuietGlass.test.mjs` — update assertions to new values.

**Delete (end of migration):** the inline `ChromeActionButton` function inside `TabBar.tsx`; obsolete `jsonita-esc-key*` and old `kbd` CSS rules.

---

## Task 0: Branch, docs, changelog

**Files:** git only; `CHANGELIST.md` (modify top).

- [ ] **Step 1:** From a clean `main`, create the feature branch.
  Run: `git -C /Users/jin.huang/dev/projects/jsonita checkout -b feat/control-language main`
- [ ] **Step 2:** Delete the rejected codex branch (local only; it has no remote).
  Run: `git -C /Users/jin.huang/dev/projects/jsonita branch -D codex/raycast-action-controls`
- [ ] **Step 3:** Commit the design + plan docs already written.
  Run: `git -C /Users/jin.huang/dev/projects/jsonita add docs/superpowers/specs/2026-07-15-control-language-design.md docs/superpowers/plans/2026-07-15-control-language.md design/prototype/controls.html && git -C /Users/jin.huang/dev/projects/jsonita commit -m "docs(control-language): add design, plan, specimen"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>
- [ ] **Step 4:** Add a `CHANGELIST.md` top entry (change, affected files, reason) per WORKFLOW.md, commit it.

---

## Task 1: GlyphSymbols — the vector glyph set

**Files:**
- Create: `src/components/GlyphSymbols.tsx`
- Modify: `src/App.tsx` (mount once)
- Test: `tests/components/glyphSymbols.test.mjs`

**Interfaces:**
- Produces: a DOM node containing `<symbol id="g-cmd|g-shift|g-up|g-down|g-return">`, hidden, mounted once. Consumed by `ShortcutGlyph` via `<use href="#g-<id>"/>`.

- [ ] **Step 1: Write the failing test** (`tests/components/glyphSymbols.test.mjs`):

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const root = new URL('../../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('GlyphSymbols declares the vector glyph set with verified paths', () => {
  const src = read('src/components/GlyphSymbols.tsx');
  assert.match(src, /id="g-cmd"/);
  assert.match(src, /id="g-shift"/);
  assert.match(src, /id="g-up"/);
  assert.match(src, /id="g-down"/);
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
```

- [ ] **Step 2: Run — expect FAIL** (`GlyphSymbols` undefined).
  Run: `node --test tests/components/glyphSymbols.test.mjs`

- [ ] **Step 3: Implement** `src/components/GlyphSymbols.tsx`. Copy the exact `<symbol>` paths from `design/prototype/controls.html` (lines ~160-174). Each symbol: `fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"`; stroke-width `7` for `g-cmd` (viewBox 64), `2.5` for `g-shift`/`g-up`/`g-down` (viewBox 24), `4` for `g-return` (viewBox 56).

```tsx
/** Hidden vector glyph set for shortcut keycaps. Mounted once in App. */
export function GlyphSymbols() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute', overflow: 'hidden' }}>
      <symbol id="g-cmd" viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 24a8 8 0 0 1-8-8 8 8 0 0 1 8-8 8 8 0 0 1 8 8v32a8 8 0 0 1-8 8 8 8 0 0 1-8-8 8 8 0 0 1 8-8h32a8 8 0 0 1 8 8 8 8 0 0 1-8 8 8 8 0 0 1-8-8V16a8 8 0 0 1 8-8 8 8 0 0 1 8 8 8 8 0 0 1-8 8z"/>
      </symbol>
      <symbol id="g-shift" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12L12 5L19 12M8 12L8 19L16 19L16 12"/>
      </symbol>
      <symbol id="g-up" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19L12 5M6 11L12 5L18 11"/>
      </symbol>
      <symbol id="g-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5L12 19M6 13L12 19L18 13"/>
      </symbol>
      <symbol id="g-return" viewBox="0 0 56 56" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 19.2811 49.5156 C 20.5233 49.5156 21.3436 48.6719 21.3436 47.4531 C 21.3436 46.8438 21.1561 46.3984 20.7811 46.0234 L 14.0311 39.4375 L 9.5780 35.6406 L 15.0858 35.8750 L 44.9920 35.8750 C 50.4529 35.8750 52.7267 33.3672 52.7267 28.0703 L 52.7267 14.2188 C 52.7267 8.7578 50.4529 6.4844 44.9920 6.4844 L 31.8671 6.4844 C 30.5780 6.4844 29.7342 7.4219 29.7342 8.5703 C 29.7342 9.7188 30.5780 10.6562 31.8671 10.6562 L 44.9920 10.6562 C 47.4764 10.6562 48.5545 11.7344 48.5545 14.2188 L 48.5545 28.0703 C 48.5545 30.6250 47.4764 31.7031 44.9920 31.7031 L 15.0858 31.7031 L 9.5780 31.9375 L 14.0311 28.1406 L 20.7811 21.5547 C 21.1561 21.1797 21.3436 20.7109 21.3436 20.1016 C 21.3436 18.9062 20.5233 18.0391 19.2811 18.0391 C 18.7655 18.0391 18.1561 18.2969 17.7577 18.6953 L 3.9764 32.2188 C 3.5077 32.6640 3.2733 33.2031 3.2733 33.7891 C 3.2733 34.3516 3.5077 34.9140 3.9764 35.3594 L 17.7577 48.8828 C 18.1561 49.2813 18.7655 49.5156 19.2811 49.5156 Z"/>
      </symbol>
    </svg>
  );
}
```

- [ ] **Step 4:** Mount in `src/App.tsx` — add `import { GlyphSymbols } from './components/GlyphSymbols';` and render `<GlyphSymbols />` once at the root (alongside the existing window chrome).
- [ ] **Step 5: Run — expect PASS.** Run: `node --test tests/components/glyphSymbols.test.mjs`
- [ ] **Step 6: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 7: Commit.** `git -C ... add src/components/GlyphSymbols.tsx src/App.tsx tests/components/glyphSymbols.test.mjs && git -C ... commit -m "feat(glyphs): add vector ⌘⇧↑↓↵ symbol set"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 2: shortcutTiles parser (accelerators.ts)

**Files:**
- Modify: `src/keyboard/accelerators.ts`
- Test: `tests/components/shortcutGlyph.test.mjs` (parser cases live here)

**Interfaces:**
- Produces: `type ShortcutTile = { glyph?: string; text?: string }` and `function shortcutTiles(accelerator: string): ShortcutTile[]`. `glyph` is a symbol id (`'g-cmd'` | `'g-shift'` | `'g-return'` | …); `text` is a keycap label (`'K'`, `'esc'`, `'tab'`, `'space'`, `'+'`). Mac-only mapping (product is macOS). Unknown modifiers (ctrl/option) fall back to `text: 'Ctrl'` / `'Alt'` so configurable shortcuts still render.

- [ ] **Step 1: Write failing tests** appended to `tests/components/shortcutGlyph.test.mjs`:

```js
import { shortcutTiles } from '../../src/keyboard/accelerators.ts';

test('shortcutTiles maps mac modifiers to glyphs and keys to text', () => {
  assert.deepEqual(shortcutTiles('CmdOrCtrl+Shift+J'), [
    { glyph: 'g-cmd' }, { glyph: 'g-shift' }, { text: 'J' },
  ]);
  assert.deepEqual(shortcutTiles('CmdOrCtrl+Enter'), [{ glyph: 'g-cmd' }, { glyph: 'g-return' }]);
  assert.deepEqual(shortcutTiles('Escape'), [{ text: 'esc' }]);
  assert.deepEqual(shortcutTiles('CmdOrCtrl+K'), [{ glyph: 'g-cmd' }, { text: 'K' }]);
});
```

Note: importing `.ts` directly under `node --test` requires the test runner to handle TS. The repo's existing tests avoid this by reading source as text. **Therefore:** test the parser by reading the source and asserting the mapping table exists, OR add a tiny build step. Simplest path consistent with the repo: assert on source text that the mapping object is present (see Step 3 structure) — replace the `import`/`deepEqual` test above with:

```js
test('shortcutTiles maps mac modifiers to glyph ids', () => {
  const src = read('src/keyboard/accelerators.ts');
  assert.match(src, /export type ShortcutTile/);
  assert.match(src, /'cmdorctrl'|'cmd':\s*\{[^}]*g-cmd/);
  assert.match(src, /'shift':\s*\{[^}]*g-shift/);
  assert.match(src, /'enter'|'return':\s*\{[^}]*g-return/);
  assert.match(src, /'escape':\s*\{[^}]*text:\s*'esc'/);
});
```

- [ ] **Step 2: Run — expect FAIL.** Run: `node --test tests/components/shortcutGlyph.test.mjs`
- [ ] **Step 3: Implement** in `src/keyboard/accelerators.ts` — add a `TILE_MAP` (lowercased part → tile) mirroring `formatAcceleratorPart`'s mac branch, plus:

```ts
export type ShortcutTile = { glyph?: string; text?: string };

const TILE_MAP: Record<string, ShortcutTile> = {
  cmdorctrl: { glyph: 'g-cmd' }, cmd: { glyph: 'g-cmd' }, command: { glyph: 'g-cmd' }, meta: { glyph: 'g-cmd' },
  shift: { glyph: 'g-shift' },
  enter: { glyph: 'g-return' }, return: { glyph: 'g-return' },
  escape: { text: 'esc' }, esc: { text: 'esc' },
  space: { text: 'space' }, tab: { text: 'tab' },
  plus: { text: '+' }, minus: { text: '-' },
};

export function shortcutTiles(accelerator: string): ShortcutTile[] {
  return accelerator.split('+').map((p) => p.trim()).filter(Boolean).map((part) => {
    const mapped = TILE_MAP[part.toLowerCase()];
    if (mapped) return mapped;
    return { text: part.length === 1 ? part.toUpperCase() : part };
  });
}
```

- [ ] **Step 4: Run — expect PASS.** Run: `node --test tests/components/shortcutGlyph.test.mjs`
- [ ] **Step 5: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 6: Commit.** `git -C ... commit -m "feat(accelerators): add shortcutTiles parser"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 3: ShortcutGlyph component + matte-tile CSS

**Files:**
- Create: `src/components/ShortcutGlyph.tsx`
- Modify: `src/styles/global.css` (add `.jsonita-shortcut-glyph`, `.jsonita-shortcut-tile`, scale mods; flatten dark; SF Pro keycap font)
- Test: `tests/components/shortcutGlyph.test.mjs` (append render-structure test)

**Interfaces:**
- Produces: `<ShortcutGlyph accelerator="CmdOrCtrl+Enter" />` → `<span class="jsonita-shortcut-glyph">` of `<span class="jsonita-shortcut-tile">` children (each either an `<svg class="jsonita-shortcut-glyph-icon"><use href="#g-cmd"/></svg>` or text). Props: `accelerator?: string`; `decorative?: boolean` (aria-hidden when true); optional `className`.

- [ ] **Step 1: Write failing test** (append):

```js
test('ShortcutGlyph renders accelerator as adjacent matte tiles', () => {
  const src = read('src/components/ShortcutGlyph.tsx');
  assert.match(src, /import \{ shortcutTiles \} from '\.\.\/keyboard\/accelerators'/);
  assert.match(src, /className=\{`jsonita-shortcut-glyph/);
  assert.match(src, /href=\{`#\$`/); // href={`#g-${tile.glyph}`}
});
test('matte keycap CSS uses SF Pro, thin border, and flat dark tiles', () => {
  const css = read('src/styles/global.css');
  assert.match(css, /\.jsonita-shortcut-tile\s*\{[\s\S]*var\(--font-ui\)[\s\S]*\}/);
  assert.match(css, /\.jsonita-shortcut-tile\s*\{[\s\S]*1px solid var\(--kbd-border\)/);
  // dark keycap is flat, not a gradient
  assert.doesNotMatch(css, /\[data-theme="dark"\][\s\S]*?--kbd-bg:\s*linear-gradient/);
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** `src/components/ShortcutGlyph.tsx`:

```tsx
import { shortcutTiles, type ShortcutTile } from '../keyboard/accelerators';

type Props = { accelerator?: string; decorative?: boolean; className?: string };

export function ShortcutGlyph({ accelerator, decorative = false, className }: Props) {
  if (!accelerator) return null;
  const tiles = shortcutTiles(accelerator);
  const label = tiles.map(accessibleLabel).join(' ');
  return (
    <span
      className={`jsonita-shortcut-glyph${className ? ` ${className}` : ''}`}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : label}
    >
      {tiles.map((tile, i) => (
        <span key={i} className="jsonita-shortcut-tile">
          {tile.glyph ? (
            <svg className="jsonita-shortcut-glyph-icon" aria-hidden="true"><use href={`#g-${tile.glyph.slice(2)}`} /></svg>
          ) : (
            tile.text
          )}
        </span>
      ))}
    </span>
  );
}

function accessibleLabel(tile: ShortcutTile): string {
  if (tile.text) return tile.text;
  return { 'g-cmd': 'command', 'g-shift': 'shift', 'g-return': 'return', 'g-up': 'up', 'g-down': 'down' }[tile.glyph!] ?? '';
}
```

(Note: `tile.glyph` is stored as `'g-cmd'` etc.; the `<use href>` uses the same id — adjust the slice if you store the bare id instead. Pick ONE convention and keep it consistent across Tasks 1-3.)

- [ ] **Step 4: Add CSS** to `src/styles/global.css`, copying exact values from the specimen's `.kbd` / `.kbd--sm` / `.kbd--lg` / `.kbd .glyph` rules (specimen lines ~138-151). Rename `.kbd`→`.jsonita-shortcut-tile`, `.glyph`→`.jsonita-shortcut-glyph-icon`. Key facts to copy: font `500 13px/1 var(--font-ui)`, `letter-spacing:.01em`, `border:1px solid var(--kbd-border)`, `box-shadow: inset 0 1px 0 var(--kbd-hi), 0 1px 1px rgba(20,26,36,.05)`, sm 11px, lg 16px, icon 13/10/17px. Add to the `[data-theme="dark"]` block (specimen): `--kbd-bg: rgba(255,255,255,0.08)` (flat) and ensure light `--kbd-bg` stays the white gradient. Use `--kbd-bg`/`--kbd-border`/`--kbd-hi` tokens (add to `tokens.css` both themes if missing — they exist in the specimen's inline tokens; mirror them into `tokens.css`).
- [ ] **Step 5: Run — expect PASS.** Run: `node --test tests/components/shortcutGlyph.test.mjs`
- [ ] **Step 6: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 7: Commit.** `git -C ... commit -m "feat(shortcut-glyph): matte keycap tile component + css"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 4: ActionButton component + glass commit CSS

**Files:**
- Create: `src/components/ActionButton.tsx`
- Modify: `src/styles/global.css` (add `.jsonita-action-button` + variants)
- Test: `tests/components/actionButton.test.mjs`

**Interfaces:**
- Produces: `<ActionButton variant="primary|secondary|danger|text">` — a glass commit button (thin border, themed text). Optional trailing `<ShortcutGlyph>` via children.

- [ ] **Step 1: Write failing test:**

```js
test('ActionButton exposes four glass variants with thin borders', () => {
  const src = read('src/components/ActionButton.tsx');
  assert.match(src, /type ActionButtonVariant = 'primary' \| 'secondary' \| 'danger' \| 'text'/);
  assert.match(src, /jsonita-action-button-\$\{variant\}/);
  const css = read('src/styles/global.css');
  assert.match(css, /\.jsonita-action-button-primary\s*\{[\s\S]*var\(--surface-raised\)[\s\S]*var\(--border-strong\)/);
  assert.match(css, /\.jsonita-action-button-secondary\s*\{[\s\S]*var\(--control-bg\)[\s\S]*var\(--control-border\)/);
  assert.match(css, /\.jsonita-action-button-danger\s*\{[\s\S]*var\(--danger\)/);
  // primary is NOT a solid slab / white text
  assert.doesNotMatch(css, /\.jsonita-action-button-primary\s*\{[^}]*color:\s*#fff/);
});
```

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** `src/components/ActionButton.tsx` (mirror specimen `.btn` + `.btn-primary/.btn-secondary/.btn-danger/.btn-text`, specimen lines ~99-107):

```tsx
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
export type ActionButtonVariant = 'primary' | 'secondary' | 'danger' | 'text';
type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ActionButtonVariant }>;
export function ActionButton({ variant = 'secondary', className, children, ...props }: Props) {
  return (
    <button {...props} type={props.type ?? 'button'} className={`jsonita-action-button jsonita-action-button-${variant}${className ? ` ${className}` : ''}`}>
      {children}
    </button>
  );
}
```

- [ ] **Step 4: Add CSS** copying specimen `.btn`/`.btn-primary`(glass: `--surface-raised`+`--border-strong`+`var(--text)`)/`.btn-secondary`/`.btn-danger`/`.btn-text` rules verbatim (rename `.btn`→`.jsonita-action-button`). Heights/padding/radius/font from specimen.
- [ ] **Step 5: Run — expect PASS.**
- [ ] **Step 6: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 7: Commit.** `git -C ... commit -m "feat(action-button): glass commit button primitives"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 5: ChromeIconButton component (extract from TabBar)

**Files:**
- Create: `src/components/ChromeIconButton.tsx`
- Modify: `src/styles/global.css` (revise `.jsonita-chrome-icon-button` to 34px glass — specimen `.chrome` lines ~113-118)
- Test: `tests/components/chromeIconButton.test.mjs`

**Interfaces:**
- Produces: `<ChromeIconButton aria-label tooltipLabel tooltipShortcut onSelect>{icon}</ChromeIconButton>` — 34px, transparent at rest, surface on hover/focus/selected, app tooltip with `ShortcutGlyph`.

- [ ] **Step 1: Write failing test:**

```js
test('ChromeIconButton renders a 34px glass icon action with ShortcutGlyph tooltip', () => {
  const src = read('src/components/ChromeIconButton.tsx');
  assert.match(src, /import \{ ShortcutGlyph \} from '\.\/ShortcutGlyph'/);
  assert.match(src, /className=\{`jsonita-chrome-icon-button/);
  assert.match(src, /tooltipShortcut && <ShortcutGlyph/);
  const css = read('src/styles/global.css');
  assert.match(css, /\.jsonita-chrome-icon-button\s*\{[\s\S]*width:\s*34px[\s\S]*height:\s*34px/);
});
```

- [ ] **Step 2: Run — expect FAIL.** (Existing `.jsonita-chrome-icon-button` is 30×28 — this test will fail until CSS is revised.)
- [ ] **Step 3: Implement** `src/components/ChromeIconButton.tsx` — move the body of `TabBar`'s inline `ChromeActionButton` here, but render the tooltip shortcut via `<ShortcutGlyph accelerator={tooltipShortcut} decorative />` instead of `<kbd>{tooltipShortcut}</kbd>`. Keep `useId`, `aria-describedby`, `role="tooltip"`.
- [ ] **Step 4: Revise CSS** — update `.jsonita-chrome-icon-button` to specimen `.chrome` values: `width:34px;height:34px;border:0;border-radius:8px;background:transparent;color:var(--text-muted)`, hover/focus/selected → `--surface-raised`. Keep `.jsonita-chrome-tooltip*` but switch `.jsonita-chrome-tooltip-shortcut` to inherit the matte-tile look (or replace its `<kbd>` usage — already done by ShortcutGlyph in Step 3).
- [ ] **Step 5: Run — expect PASS.**
- [ ] **Step 6: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 7: Commit.** `git -C ... commit -m "feat(chrome-button): extract 34px glass ChromeIconButton"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 6: TabBar migration + split/single toggle

**Files:**
- Modify: `src/shell/TabBar.tsx`
- Modify: `tests/shell/chromeActions.test.mjs`

**Interfaces:** Consumes `ChromeIconButton`, `ShortcutGlyph`. The chrome group becomes split + single (two-button toggle) + history + (settings lives in its own spot or stays — keep `openSettings` action but as a single button).

- [ ] **Step 1: Update the test first** (`tests/shell/chromeActions.test.mjs`). The old test asserts `width:\s*30px`/`height:\s*28px` and `tooltipShortcut=\{formatAccelerator(...)}`. Replace with assertions for the new primitives and the split/single toggle:

```js
test('chrome uses ChromeIconButton with vector-glyph tooltips', () => {
  const tabBar = read('src/shell/TabBar.tsx');
  assert.match(tabBar, /import \{ ChromeIconButton \} from '\.\.\/components\/ChromeIconButton'/);
  assert.match(tabBar, /tooltipShortcut=\{[^}]*shortcutSplitToggle/);   // raw accelerator passed
  assert.doesNotMatch(tabBar, /<kbd[^>]*>.*<\/kbd>/);                   // no bare kbd in chrome
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
  // two ChromeIconButton instances for view mode
  const viewButtons = tabBar.match(/aria-label=\{[^}]*switchTo(Split|Single)Panel[^}]*\}/g) ?? [];
  assert.ok(viewButtons.length >= 2, 'expected split + single toggle buttons');
});
```
Drop the now-stale assertions (`width:30px`, `height:28px`, `tooltipShortcut=\{formatAccelerator\('CmdOrCtrl\+Y'\)\}` literal). Keep the brand-mark and tab-pill assertions unchanged.

- [ ] **Step 2: Run — expect FAIL.** Run: `node --test tests/shell/chromeActions.test.mjs`
- [ ] **Step 3: Migrate `TabBar.tsx`:** delete the inline `ChromeActionButton` function; import `ChromeIconButton`. Render the view-mode toggle as **two** `ChromeIconButton`s — split (selected when `!singlePaneMode`) and single (selected when `singlePaneMode`), each calling `toggleSinglePaneMode`. Keep history + settings as their own `ChromeIconButton`s. Pass `tooltipShortcut` as the **raw** accelerator (e.g. `settings.shortcutSplitToggle`, `'CmdOrCtrl+Y'`, `'CmdOrCtrl+,'`) — `ChromeIconButton` forwards it to `ShortcutGlyph`.
- [ ] **Step 4: Run — expect PASS.** Run: `node --test tests/shell/chromeActions.test.mjs`
- [ ] **Step 5: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 6: Commit.** `git -C ... commit -m "feat(shell): chrome uses ChromeIconButton + split/single toggle"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 7: Settings migration

**Files:**
- Modify: `src/settings/SettingsView.tsx` (footer Done/Reset → `ActionButton`; shortcut rows → `ShortcutGlyph`; `<kbd>Esc</kbd>` → `ShortcutGlyph accelerator="Escape"`)
- Modify: `tests/settings/*.test.mjs` if they assert old kbd markup.

- [ ] **Step 1: Grep current kbd/button markup** — `grep -n 'kbd\|jsonita-page-close\|keyCapStyle' src/settings/SettingsView.tsx`. Note every `<kbd>` and inline button.
- [ ] **Step 2: Update tests** that assert `<kbd[^>]*>Esc<\/kbd>` (chromeActions settings test + any settings test) to assert `<ShortcutGlyph accelerator="Escape"` or the rendered `jsonita-shortcut-tile`. Write the failing assertion first.
- [ ] **Step 3: Run — expect FAIL.**
- [ ] **Step 4: Migrate** — replace the footer primary (`Done`) with `<ActionButton variant="primary">`; `Reset` → `variant="danger"`; reset-all → `variant="text"`. Replace the `keyCapStyle`-based `<kbd>` shortcut displays with `<ShortcutGlyph accelerator={...} />` (pass raw accelerators). Replace `<kbd>Esc</kbd>` with `<ShortcutGlyph accelerator="Escape" />`.
- [ ] **Step 5: Run — expect PASS.** Run: `node --test tests/settings/*.test.mjs tests/shell/chromeActions.test.mjs`
- [ ] **Step 6: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 7: Commit.** `git -C ... commit -m "feat(settings): glass buttons + matte shortcut tiles"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 8: History migration

**Files:**
- Modify: `src/history/HistoryModal.tsx`, `src/history/HistoryDocumentPreview.tsx`
- Modify: `tests/history/historyLibrary.test.mjs`

- [ ] **Step 1:** Read the current preview-action / clear / pin / star markup (`grep -n 'jsonita-history-preview-action\|jsonita-history-clear\|kbd' src/history/*.tsx`).
- [ ] **Step 2: Update tests** to expect `ActionButton` for clear/open and `ShortcutGlyph` for any shortcut hints; write failing assertions first.
- [ ] **Step 3: Run — expect FAIL.**
- [ ] **Step 4: Migrate** — preview actions (Open, Clear, Pin, Star) → `ActionButton` variants (Open=secondary, Clear=danger, Pin/Star=secondary toggles). Any `kbd` shortcut → `ShortcutGlyph`.
- [ ] **Step 5: Run — expect PASS.**
- [ ] **Step 6: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 7: Commit.** `git -C ... commit -m "feat(history): glass actions + matte tiles"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 9: AI Fix migration

**Files:**
- Modify: `src/panes/AiFixPane.tsx` (accept/reject → `ActionButton`; the disabled AI entry in TabBar already uses accent glass — leave its logic, ensure it's glass-consistent)
- Modify: `src/shell/TabBar.tsx` (the `jsonita-ai-fix-entry` styling — keep accent glass, confirm thin border)
- Test: add/extend `tests/panes/aiFixControls.test.mjs` (port the structure from the codex branch's intent, written fresh).

- [ ] **Step 1: Write failing test** asserting AiFixPane accept = `ActionButton variant="primary"`, reject = `variant="secondary"`.
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Migrate** AiFixPane review actions to `ActionButton`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 6: Commit.** `git -C ... commit -m "feat(ai-fix): glass accept/reject actions"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 10: Shortcut permission modal + esc/window hints

**Files:**
- Modify: `src/permissions/ShortcutPermissionModal.tsx`, `src/shell/FloatingWindow.tsx`, `src/shell/SinglePaneHint.tsx`
- Modify: `tests/shell/escCloseHint.test.mjs`

- [ ] **Step 1: Update escCloseHint test** — old asserts `jsonita-esc-key`/`<kbd className="jsonita-esc-key">Esc</kbd>`. Replace with `<ShortcutGlyph accelerator="Escape"` rendered twice (esc esc). Write failing assertions first.
- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Migrate** — FloatingWindow `jsonita-esc-key-combo` → `<span class="jsonita-shortcut-glyph"><ShortcutGlyph accelerator="Escape"/><ShortcutGlyph accelerator="Escape"/></span>` (or two tiles). SinglePaneHint `<kbd>{formatAccelerator('CmdOrCtrl+Enter')}</kbd>` → `<ShortcutGlyph accelerator="CmdOrCtrl+Enter" />`. ShortcutPermissionModal shortcut displays → `ShortcutGlyph`.
- [ ] **Step 4: Run — expect PASS.**
- [ ] **Step 5: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 6: Commit.** `git -C ... commit -m "feat(shell): matte esc + shortcut hints"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 11: CSS cleanup + stray-kbd sweep

**Files:**
- Modify: `src/styles/global.css` (remove obsolete `.jsonita-esc-key*`, old bare-`kbd` rules, `.jsonita-chrome-tooltip-shortcut` kbd styling if unused)
- Verify: no remaining bare `<kbd>` in `src/`

- [ ] **Step 1: Sweep** — `grep -rn '<kbd' src/` must return nothing (all migrated to ShortcutGlyph). If any remain, migrate them.
- [ ] **Step 2: Remove dead CSS** — delete `.jsonita-esc-key`, `.jsonita-esc-key-combo`, and any `kbd` element-selector rules now superseded by `.jsonita-shortcut-tile`. If `--commit`/`--commit-hover` are unreferenced (`grep -rn '\-\-commit' src/` empty), remove them from `tokens.css`.
- [ ] **Step 3: Run all tests.** Run: `node --test tests/**/*.test.mjs` — fix any assertion still referencing removed classes.
- [ ] **Step 4: Typecheck.** Run: `pnpm tsc`
- [ ] **Step 5: Commit.** `git -C ... commit -m "chore(styles): remove obsolete kbd/esc-key css"`

  Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>

---

## Task 12: Verify build + visual QA

- [ ] **Step 1: Full typecheck.** Run: `pnpm tsc` — expect 0 errors.
- [ ] **Step 2: Full test suite.** Run: `node --test tests/**/*.test.mjs` — expect all pass.
- [ ] **Step 3: Production build.** Run: `pnpm build` — expect success.
- [ ] **Step 4: Visual QA** (run app: `pnpm tauri dev`) — confirm against `design/prototype/controls.html`: light + dark; chrome toggle (split/single); Run/Cancel/Reset buttons all glass; shortcut tiles matte (⌘⇧↵ as vectors); Settings/History/AiFix controls; esc hints. Confirm dark mode is flat (no muddy gradients).
- [ ] **Step 5: docs check.** Run: `git diff --check` and `diff -u AGENTS.md CLAUDE.md` (per WORKFLOW validation).
- [ ] **Step 6: Final commit** if QA surfaced fixes. Update `CHANGELIST.md` if scope shifted.

---

## Self-Review

**Spec coverage:** specimen sections → commit buttons (Task 4+7), chrome toggle (5+6), keycap signature (1+2+3), settings (7) all map to tasks. Dark flat (Task 3 step 4 + test). "All glass / no solid primary" (Task 4 test). ⌘⇧↑↓↵ vectors (Task 1). Adjacent tiles + retained `formatAccelerator` string (Task 2 keeps `formatAccelerator` untouched; Task 3 renders tiles). Out-of-scope command menu: not present. ✓

**Placeholder scan:** migration tasks (7-10) intentionally direct the implementer to grep-then-replace exact current markup rather than pre-listing every line, because the current `.tsx` contents must be read at implementation time; each still names exact files, the replacement primitive, and a concrete failing test. No "TBD"/"add error handling". Glyph/component code is complete.

**Type consistency:** `ShortcutTile` (Task 2) consumed by `ShortcutGlyph` (Task 3); glyph id convention flagged in Task 3 Step 3 to keep Task 1↔3 consistent. `ActionButtonVariant` (Task 4) used in Tasks 7-9. `ChromeIconButton` props (Task 5) match TabBar usage (Task 6).

**Risk note:** the `node --test` runner cannot import `.ts` directly — all tests use source-text assertions (matching the repo's existing pattern). Task 2 Step 1 reflects this. If the team later adds a TS-aware runner, the parser test can switch to real `deepEqual`.
