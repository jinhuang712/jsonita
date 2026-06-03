# CAST Workflow

This file is the mandatory workflow policy for Jsonita. The `cast-a-doc`
workflow is the base layer and stays above the `cast-a-start` planning layer.
Project-specific agent rules live here so `AGENTS.md` and `CLAUDE.md` can stay
thin entry files.

## Load Order

1. Read the active agent entry file, such as `AGENTS.md` or `CLAUDE.md`.
2. Read this file: `.cast-docs/WORKFLOW.md`.
3. Treat both files as executable constraints.
4. If a decision affects product scope, technical direction, rewrite depth, or
   implementation order, offer concrete options and ask instead of guessing.

## Path And Git Policy

- Resolve `<repo-root>` as this repository checkout.
- Do not write machine-specific absolute paths into checked-in workflow text.
- Avoid broad global searches and large file dumps; use targeted `rg`, `find`,
  `wc`, and small `sed -n` reads.
- This repository is not under the internal repository root that requires
  `yummy` / `ym`; use direct `git` commands, preferably
  `git -C <repo-root> ...`.
- Do not use `yummy` or `ym` in this repository.
- Commit every completed code or documentation repair. Do not push unless the
  user explicitly asks for push.

## CAST Docs Authoring

- Treat CAST Docs JSON as source and HTML as generated artifact whenever a page
  has a JSON source.
- Read `.cast-docs/project.json` before generating HTML.
- Use `cast-a-doc` stable script entrypoints for JSON validation, rendering, and
  HTML validation.
- If the renderer is unavailable, keep the source file and record rendering as
  blocked instead of inventing unchecked HTML.
- Do not hand-edit generated HTML as the primary source when a JSON source
  exists.
- `plan/*.html` and `spec/*.html` are generated artifacts. Each published page
  must have a same-name CAST JSON source under `plan/` or `spec/`.

## cast-a-start Planning Layer

- Use the smallest gate that fits the work: light for safe local fixes,
  standard for planning/spec changes, strict for public docs, release surfaces,
  repository migrations, and handoff work.
- Keep `README.md`, `index.html`, `site/todo.json`, `site/changelist.json`,
  `todo.html`, `changelist.html`, `plan/`, and `spec/` consistent after
  requirement, release, or workflow changes.
- `site/todo.json` owns unresolved project-level questions, deferred decisions,
  risks, and readiness blockers as an open backlog. Fixed or answered items
  leave TODO and become changelist/history entries.
- `site/changelist.json` owns durable history for meaningful project changes,
  including what changed, why, affected files, validation, and follow-up work.
- Reader-facing homepage paths should point to rendered pages and human-facing
  documents first. Raw JSON, `.cast-docs/`, profile files, manifests, and
  maintenance sources may be linked only from a maintenance section.

## Jsonita Project Contracts

- Product scope: a tiny macOS menu-bar JSON toolkit invoked with `Cmd+Shift+J`.
- v1 beta release path: GitHub Releases plus `.dmg` for small internal testing.
  Homebrew Cask, updater, npm wrapper, and broader distribution stay v1.1+ work
  until release artifacts, stable URLs, and `sha256` values exist.
- API key storage is the app data directory `secrets.json` file with restricted
  file permissions. Do not reintroduce system Keychain as the product storage
  path.
- Local data stays local by default: SQLite, settings, window state, and
  `secrets.json`; logs must not record JSON document content or API keys.
- Version markers must stay aligned across `package.json`,
  `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and the About panel.
- Packaging scripts remain separate entrypoints for macOS DMG, macOS app,
  Windows NSIS installer, and all-platform builds.

## Document Structure

- `plan/00_overview.html` through `plan/04_nfr.html` own product intent,
  boundaries, workflows, milestones, and success criteria.
- `spec/00_architecture.html` through `spec/15_logging.html` own architecture,
  interfaces, invariants, storage, release mechanics, UI authority, and
  verification.
- `spec/01_mockups.json` / `spec/01_mockups.html` remain the visual interaction
  contract for Jsonita UI; keep them aligned with `design/HANDOFF.md` and
  `src/styles/tokens.css`.
- `TODO.md` and `CHANGELIST.md` are human-readable mirrors for existing project
  workflow. Keep them aligned with `site/todo.json` and
  `site/changelist.json` when updating TODO or changelist history.
- `progress/` has been intentionally removed. Do not recreate it unless the
  user explicitly asks for progress pages again.

## Change Protocol

For any product, release, architecture, storage, UI, or workflow change:

1. Update the owning plan/spec memory first when behavior or contracts change.
2. Update `site/todo.json` for unresolved follow-up or verification work.
3. Update `site/changelist.json` for accepted meaningful changes.
4. Regenerate or check rendered HTML for changed JSON sources.
5. Run targeted validation before committing.
6. Restart Jsonita after implementation changes so the user can verify with
   `Cmd+Shift+J`.

## Validation

- Documentation-only repairs should at least run:
  - `pnpm exec node scripts/verify_doc_links.mjs`
  - `pnpm exec node scripts/check_cast_docs.mjs`
- `pnpm docs:check` must confirm render freshness for `site/*.json`,
  `plan/*.json`, and `spec/*.json`, plus bilingual locale switchers on every
  plan/spec HTML page.
- Implementation or Tauri configuration changes should additionally run the
  relevant subset of `pnpm build`, `pnpm tsc --noEmit`, `cargo check`,
  `cargo test`, `cargo build`, or `pnpm tauri dev`.
- Avoid dependency installation unless the user asks or validation is blocked by
  missing local dependencies.

## Testing Boundaries

- Unit-test core pure functions when behavior changes: Rust JSON engine helpers,
  `ai::validate::extract_json`, and frontend utilities such as diff or tree path
  helpers.
- UI interactions, system shortcuts, macOS window behavior, menu bar behavior,
  and AI HTTP connectivity are primarily manual/integration verification.
- CI should focus on Rust tests/build, TypeScript type checks, and lint/build
  quality gates; do not add heavy UI e2e unless the user asks.
