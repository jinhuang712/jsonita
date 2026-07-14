# Documentation Structure Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Jsonita's plan/spec split and expansive design corpus with a concise `spec/` and `design/` structure while retaining `docs/`.

**Architecture:** Five specifications own durable product and architecture decisions. Three small design artifacts describe UI intent and a low-fidelity interaction flow. `docs/superpowers/` remains the process and GitHub Pages-compatible documentation location; historical decisions are summarized in `CHANGELIST.md` instead of a `progress/` directory.

**Tech Stack:** Markdown, standalone HTML, Node.js test runner, TypeScript, Vite, Git.

## Global Constraints

- Do not modify or remove `docs/` publishing/process ownership.
- Do not preserve deleted documents in a new archive directory.
- Keep exact implementation details in source, tests, or scripts rather than re-copying them into the new specs.
- Keep `AGENTS.md` and `CLAUDE.md` byte-identical.
- Do not install dependencies for this documentation-only migration.

---

### Task 1: Establish the concise specification corpus

**Files:**
- Create: `spec/00-product.md`, `spec/10-behavior.md`, `spec/20-architecture.md`, `spec/30-operations.md`, `spec/40-validation.md`
- Modify: `spec/README.md`, `PROJECT.md`, `README.md`, `WORKFLOW.md`, `AGENTS.md`, `CLAUDE.md`

- [x] **Step 1: Write the five specifications with explicit ownership boundaries**

Each document must identify what it owns and link only to sibling specs or
design documentation. `00-product.md` owns scope and non-goals;
`10-behavior.md` owns user-visible behavior; `20-architecture.md` owns module
and data-flow boundaries; `30-operations.md` owns local data, privacy,
reliability, and distribution; `40-validation.md` owns change validation.

- [x] **Step 2: Replace the old taxonomy in documentation navigation and workflow rules**

Update all six root documents so `spec/` is the single formal project-design
root, `design/` is a lightweight UI companion, `docs/` is retained for Pages
and Superpowers, and completed work goes only to `CHANGELIST.md`.

- [x] **Step 3: Check agent-instruction parity**

Run: `diff -u AGENTS.md CLAUDE.md`

Expected: exit status `0` and no output.

### Task 2: Replace the design corpus with a low-fidelity companion

**Files:**
- Create: `design/overview.md`, `design/screens.md`
- Modify: `design/README.md`, `design/prototype/index.html`, `tests/design/prototypeReference.test.mjs`, `TODO.md`

- [x] **Step 1: Capture the active UI direction in two Markdown files**

`overview.md` must state the quiet native-tool direction and that exact visual
tokens live in source. `screens.md` must cover the editor, Settings, History,
AI Fix, search, and global keyboard behavior without CSS values or component
implementation details.

- [x] **Step 2: Replace the prototype with a simple clickable flow**

Keep only the main workspace, Settings, History, and AI Fix states. The page
must clearly identify itself as low fidelity and must not claim to be a
full-size or high-fidelity source of truth.

- [x] **Step 3: Update design checks and open-backlog references**

Make `tests/design/prototypeReference.test.mjs` assert the low-fidelity
contract and update TODO closure criteria to reference `design/screens.md` and
the simplified prototype.

- [x] **Step 4: Run the focused test**

Run: `node --test tests/design/prototypeReference.test.mjs`

Expected: all tests pass.

### Task 3: Remove superseded documentation and record the migration

**Files:**
- Modify: `CHANGELIST.md`
- Delete: `plan/`, legacy `spec/S*.md`, `spec/M*.md`, `spec/platform/`, `spec/appendix/`, `progress/`, legacy `design/*.md`, alternate `design/prototype/*.html`, and the untracked design review/handoff/evidence packet

- [x] **Step 1: Add one durable changelist entry**

Record the new document authority, removal of `plan/` and `progress/`,
compression of the old spec taxonomy, lightweight prototype decision, and
retention of `docs/` for Pages and Superpowers.

- [x] **Step 2: Delete only artifacts superseded by the new corpus**

Remove the former S/M/I/R/A/V docs, the four former plan docs, the completed
progress note, all six historical design exploration files, `HANDOFF.md`, six
prototype variants, and the untracked design review/handoff/screenshots
package. Do not remove `docs/superpowers/`.

- [x] **Step 3: Prove no live document references a removed directory**

Run: `rg -n 'plan/|progress/|spec/(S|M|platform|appendix)|high-fidelity source of truth' README.md PROJECT.md WORKFLOW.md AGENTS.md CLAUDE.md TODO.md spec design tests --glob '!docs/**'`

Expected: exit status `1`.

### Task 4: Verify the migrated repository

**Files:**
- Verify: all changed documentation and design test files

- [x] **Step 1: Run whitespace and agent-parity checks**

Run: `git diff --check && diff -u AGENTS.md CLAUDE.md`

Expected: exit status `0`.

- [x] **Step 2: Run the Node suite and production build**

Run: `pnpm test:node && pnpm build`

Expected: both commands exit `0`.

- [x] **Step 3: Review the final change surface**

Run: `git status --short && git diff --stat && git diff --check`

Expected: only the planned documentation, prototype, and test migration is
present; `.poison/` remains untouched.
