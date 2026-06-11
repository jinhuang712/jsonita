# Jsonita Repository Workflow

This file is the mandatory workflow policy for Jsonita. `AGENTS.md` and `CLAUDE.md` are thin entry files that point here.

## Load Order

1. Read the active agent entry file, such as `AGENTS.md` or `CLAUDE.md`.
2. Read this file.
3. Treat both files as executable constraints.
4. If a decision affects product scope, technical direction, rewrite depth, or implementation order, offer concrete options and ask instead of guessing.

## Path And Git Policy

- Resolve `<repo-root>` as this repository checkout.
- Avoid broad global searches and large file dumps; use targeted `rg`, `find`, `wc`, and small `sed -n` reads.
- This repository is not under the internal repository root that requires `yummy` / `ym`; use direct `git` commands, preferably `git -C <repo-root> ...`.
- Do not use `yummy` or `ym` in this repository.
- Commits in this repository must use the GitHub `jinhuang712` identity, not an internal company identity.
- Commit completed code or documentation repairs. Do not push unless the user explicitly asks for push.
- Never revert user changes unless the user explicitly asks.

## Documentation Source Policy

- Markdown is the final source for project documentation.
- Do not recreate generated documentation HTML, CAST JSON sources, `.cast-docs/`, or CAST rendering scripts.
- Runtime HTML files such as `src/index.html` and build artifacts are application files, not documentation sources.
- `PROJECT.md` is the documentation entrypoint.
- `README.md` is the product and repository overview.
- `TODO.md` owns open backlog items only. Completed migrations and historical plans belong in `CHANGELIST.md`, not TODO.
- `CHANGELIST.md` owns durable history for meaningful product, implementation, release, and workflow changes.

## Document Structure

- `plan/` owns product intent, scope, feature list, technology choices, release boundaries, and non-functional requirements.
- `spec/` owns non-UI implementation contracts.
- `spec/README.md` is the spec entrypoint and sovereign object map.
- `spec/00_*` through `spec/10_*` are core specs. They must be Chinese, readable system documents that explain contracts, technical paths, responsibility boundaries, state flow, failure semantics, and user-visible results.
- `spec/appendix/` owns detailed schemas, command signatures, events, SQL, prompt templates, config blocks, release commands, and test matrices.
- Core specs must name behavior-affecting fields, states, events, and rules, but full field expansion belongs in `spec/appendix/`.
- Each lifecycle, state machine, failure semantic, data owner, and context rule has exactly one authoritative core spec. Other docs link to that authority instead of redefining it.
- `design/` owns all UI, visual design, interaction, prototype, design token, icon, window, menu-bar, editor, i18n, and accessibility material.
- Start design work from `design/README.md`.
- Preserve prototype source blocks in design Markdown when exact CSS, layout, or visual structure matters to implementation.
- Do not add text-art diagrams. Use prose, ordered flows, Markdown tables, or design assets instead.

## Jsonita Product Contracts

- Product scope: a tiny macOS menu-bar JSON toolkit invoked with `Cmd+Shift+J`.
- v1 beta release path: GitHub Releases plus `.dmg` for small internal testing.
- Homebrew Cask, updater, npm wrapper, and broader distribution stay v1.1+ work until release artifacts, stable URLs, and `sha256` values exist.
- API key storage is the app data directory `secrets.json` file with restricted file permissions. Do not reintroduce system Keychain as the product storage path.
- Local data stays local by default: SQLite, settings, window state, and `secrets.json`.
- Logs must not record JSON document content or API keys.
- Version markers must stay aligned across `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and the About panel.
- Packaging scripts remain separate entrypoints for macOS DMG, macOS app, Windows NSIS installer, and all-platform builds.

## Change Protocol

For product, release, architecture, storage, UI, workflow, or documentation changes:

1. Update the owning Markdown source first.
2. Keep `PROJECT.md`, `README.md`, `TODO.md`, and `CHANGELIST.md` aligned when their surfaces are affected.
3. Put UI, interaction, prototype, token, icon, and accessibility changes under `design/`.
4. Put implementation contracts under `spec/`.
5. Put product and release intent under `plan/`.
6. Run targeted validation before committing.
7. Restart Jsonita after implementation changes when manual `Cmd+Shift+J` verification is needed.

## Validation

- Documentation-only changes should at least run targeted Markdown link and residue checks.
- Implementation or Tauri configuration changes should additionally run the relevant subset of `pnpm build`, `pnpm tsc --noEmit`, `cargo check`, `cargo test`, `cargo build`, or `pnpm tauri dev`.
- Avoid dependency installation unless the user asks or validation is blocked by missing local dependencies.

## Testing Boundaries

- Unit-test core pure functions when behavior changes: Rust JSON engine helpers, `ai::validate::extract_json`, and frontend utilities such as diff or tree path helpers.
- UI interactions, system shortcuts, macOS window behavior, menu-bar behavior, and AI HTTP connectivity are primarily manual/integration verification.
- CI should focus on Rust tests/build, TypeScript type checks, and lint/build quality gates. Do not add heavy UI e2e unless the user asks.
