# Agent Instructions

Resolve `<repo-root>` as this checkout, then read and follow [WORKFLOW.md](WORKFLOW.md) before doing repository work.

## Non-Negotiable Bootstrap Rules

1. Do not proceed without loading [WORKFLOW.md](WORKFLOW.md).
2. Avoid broad global searches and large file dumps; use targeted reads.
3. This repo is outside the internal repository root that requires `yummy` / `ym`, so use direct `git -C <repo-root>` commands.
4. Commits in this repository must use the GitHub `jinhuang712` identity, not an internal company identity.
5. If a decision is unclear and affects scope, architecture, rewrite depth, implementation order, release, or user-visible behavior, offer concrete options and ask instead of guessing.
6. Never revert user changes unless the user explicitly asks.

## Jsonita Documentation Map

| Workflow Term | Jsonita Path |
| --- | --- |
| Product contracts and architecture boundaries | This file's contract sections below; source, tests, and scripts are the authority on exact implementation. |
| UI and interaction companion | [design/](design/), with a concise overview, screen-state guide, and low-fidelity prototype. |
| Project history and open work | git commit history (no separate changelog or backlog file). |
| GitHub Pages and Superpowers process records | [docs/](docs/). Keep `docs/superpowers/` for skill-created design and plan records. |

## Documentation Source Policy

- Markdown is the final source for project documentation and `docs/` remains the non-root GitHub Pages publishing location.
- [README.md](README.md) is the product and repository entrypoint.
- The enduring product, behavior, architecture, operational, and release contracts live in this file's contract sections below. Do not recreate a separate `spec/`, `plan/`, `platform/`, or `appendix/` tree for them.
- [design/](design/) records screen hierarchy, user-visible state, and interaction intent. The simple `design/prototype/index.html` is a low-fidelity flow companion, not a pixel-level source of truth.
- Exact CSS, component implementation, schema, SQL, prompt text, and release commands belong to source, tests, or scripts.
- Do not recreate generated documentation HTML, CAST JSON sources, `.cast-docs/`, or CAST rendering scripts. Runtime HTML files such as `src/index.html` are application files, not documentation sources.

## Jsonita Product Contracts

- Product scope: a tiny menu-bar JSON toolkit invoked with `Cmd+Shift+J` (macOS) / `Ctrl+Shift+J` (Windows/Linux). Format, minify, tree view, JSON/string conversion, local history, and optional user-triggered AI repair. Not a browser product, general editor, or cloud/collaboration tool. macOS is the primary v1 target; Windows is a secondary unsigned beta build.
- v1 beta release path: GitHub Releases plus `.dmg` (macOS, primary) and NSIS `.exe` (Windows, unsigned) for small internal testing.
- Homebrew Cask, updater, npm wrapper, Windows code signing/EV, and broader distribution stay v1.1+ work until release artifacts, stable URLs, and `sha256` values exist.
- API key storage is the app data directory `secrets.json` file with restricted file permissions. Do not reintroduce system Keychain as the product storage path.
- Local data stays local by default: SQLite, settings, window state, and `secrets.json`. Local data and secrets do not cross the process boundary unless the user starts a permitted operation.
- Logs must not record JSON document content, API keys, or raw AI prompts and responses.
- Version markers must stay aligned across `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and the About panel.
- Packaging scripts remain separate entrypoints for macOS DMG, macOS app, Windows NSIS installer, and all-platform builds.

## Jsonita Behavior Invariants

- User input is the visible editing truth. Preview, stale async responses, transport errors, and invalid AI output must never overwrite it. Only an explicit user action replaces input: applying a single-pane result, accepting AI output, or clearing.
- AI repair is optional and user-triggered: it needs enabled AI, a stored key, and current input, and sends only the requested document to the configured provider. The response passes local JSON validation and is shown for review; only Accept may replace input. Cancel, provider failure, rate limiting, or invalid output keep the original text.
- Never report success when a transform, storage write, or AI request failed; never expose JSON text or API keys in messages or logs.
- Hide is not quit: hiding preserves the in-memory workspace; quit ends the process and later restoration uses only durable data. A shortcut or permission failure must leave the menu-bar path usable.
- Tree view is a read-only view of current input and must not show stale data after input becomes invalid.

## Validation

- Follow [WORKFLOW.md](WORKFLOW.md) pre-commit checks.
- Documentation-only changes should at least run `git diff --check` and `diff -u AGENTS.md CLAUDE.md`.
- Implementation or Tauri configuration changes should additionally run the relevant subset of `pnpm build`, `pnpm tsc --noEmit`, `cargo check`, `cargo test`, `cargo build`, or `pnpm tauri dev`.
- Avoid dependency installation unless the user asks or validation is blocked by missing local dependencies.
