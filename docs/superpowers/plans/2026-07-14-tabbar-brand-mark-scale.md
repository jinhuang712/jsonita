# TabBar Brand Mark Scale Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the top-left Jsonita brand mark visually subordinate to the tab controls by applying the user-selected compact scale.

**Architecture:** The mark is a decorative masked `<span>` inside `TabBar`; only its layout box and the gap before the tab list change. A Node source-level test locks this visual contract without needing a Tauri WebView, while the design contract and changelist record the decision.

**Tech Stack:** React 18, TypeScript, Node built-in test runner, Vite.

## Global Constraints

- Keep the brand mark decorative and non-interactive with `aria-hidden="true"`.
- Preserve the existing image mask, colour token, opacity, 44px toolbar height, tab sizing, and chrome-action spacing.
- Use 22 × 22 layout pixels and a 6px gap before the tab list.
- Preserve pre-existing untracked `design/` and `.poison/` contents.
- Do not install dependencies.

---

### Task 1: Realign stale UI-contract tests with current production behaviour

**Files:**

- Modify: `tests/design/nativeQuietGlass.test.mjs`
- Modify: `tests/editor/searchPanel.test.mjs`

**Interfaces:**

- Consumes: the settings-card and independent Replace-regexp behaviour introduced in `f3032aa` and `3ded4a6`.
- Produces: passing checks that protect the current visual and interaction contracts without changing production code.

- [x] **Step 1: Preserve the red baseline evidence**

Run `node --test tests/design/nativeQuietGlass.test.mjs tests/editor/searchPanel.test.mjs` and confirm that the two existing assertions fail because they describe superseded controls.

- [x] **Step 2: Update the Settings assertion**

Replace the Settings `--control-bg-active` expectation with checks for its current card and toggle contracts:

```js
assert.match(settings, /background: checked \? 'var\(--toggle-on\)' : 'var\(--control-bg-hover\)'/);
assert.match(settings, /background: 'var\(--surface-raised\)'/);
assert.doesNotMatch(settings, /var\(--control-bg-active\)/);
```

- [x] **Step 3: Update the Replace-regexp assertion**

Rename the test to describe independent replacement syntax, then check `iconButton`, the private `replaceRegexp` state, and that active/ARIA state derive from it:

```js
assert.match(panel, /private replaceRegexp = true/);
assert.match(panel, /replaceRegexpButton = iconButton\('\.\*', t\('actions\.replaceRegexp'\)/);
assert.match(panel, /this\.replaceRegexpButton\.classList\.toggle\('jsonita-search-toggle-active', this\.replaceRegexp\)/);
assert.match(panel, /this\.replaceRegexpButton\.setAttribute\('aria-pressed', String\(this\.replaceRegexp\)\)/);
```

- [x] **Step 4: Verify the two repaired test files**

Run `node --test tests/design/nativeQuietGlass.test.mjs tests/editor/searchPanel.test.mjs`.

Expected: PASS; no source file under `src/` changes for this task.

### Task 2: Add a regression test for the compact brand mark

**Files:**

- Modify: `tests/shell/chromeActions.test.mjs`
- Test: `tests/shell/chromeActions.test.mjs`

**Interfaces:**

- Consumes: `src/shell/TabBar.tsx` source text through the test file's `read()` helper.
- Produces: A regression check for the selected 22px mark and 6px tab gap.

- [x] **Step 1: Write the failing test**

Append this test to `tests/shell/chromeActions.test.mjs`:

```js
test('top chrome keeps the decorative brand mark compact beside tool tabs', () => {
  const tabBar = read('src/shell/TabBar.tsx');

  assert.match(tabBar, /aria-hidden="true"/);
  assert.match(tabBar, /width:\s*22,/);
  assert.match(tabBar, /height:\s*22,/);
  assert.match(tabBar, /marginRight:\s*6,/);
  assert.match(tabBar, /WebkitMaskImage:/);
  assert.match(tabBar, /maskImage:/);
});
```

- [x] **Step 2: Run test to verify it fails**

Run: `pnpm test:node -- tests/shell/chromeActions.test.mjs`

Expected: FAIL because `TabBar.tsx` still specifies `width: 30`, `height: 30`, and `marginRight: 8`.

- [x] **Step 3: Implement the selected visual scale**

In `src/shell/TabBar.tsx`, change only the brand-mark wrapper values:

```tsx
width: 22,
height: 22,
marginRight: 6,
```

- [x] **Step 4: Run test to verify it passes**

Run: `pnpm test:node -- tests/shell/chromeActions.test.mjs`

Expected: PASS with the new compact-mark test and all existing chrome-action tests.

### Task 3: Record the visual contract and validate the application build

**Files:**

- Modify: `design/04_components.md:90`
- Modify: `CHANGELIST.md:1`

**Interfaces:**

- Consumes: `docs/superpowers/specs/2026-07-14-tabbar-brand-mark-scale-design.md`.
- Produces: A durable TabBar visual contract and changelist record tied to the user screenshot feedback.

- [x] **Step 1: Document the layout rule**

Add a sentence below the TabBar overview in `design/04_components.md` stating that the decorative mark is 22 × 22px with a 6px gap before Format, and that it must not affect toolbar height or tab hit targets.

- [x] **Step 2: Add durable history**

Insert a top-level `### polish · 收敛 TabBar 品牌标识视觉权重` section at the start of `CHANGELIST.md` using the existing three-row table format. Record the three implementation/test files, `design/04_components.md`, and the user screenshot feedback.

- [x] **Step 3: Run complete verification**

Run `pnpm test:node`, `pnpm tsc --noEmit`, `pnpm build`, `git diff --check`, and `diff -u AGENTS.md CLAUDE.md`.

Expected: all Node tests, type checking, and the production build pass; the two diff checks produce no output.

- [x] **Step 4: Commit the implementation**

Run `git add src/shell/TabBar.tsx tests/shell/chromeActions.test.mjs tests/design/nativeQuietGlass.test.mjs tests/editor/searchPanel.test.mjs design/04_components.md CHANGELIST.md docs/superpowers/plans/2026-07-14-tabbar-brand-mark-scale.md` followed by `git commit -m "polish(shell): compact tab bar brand mark"`.
