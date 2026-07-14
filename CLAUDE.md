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
| Formal product and architecture design | [spec/](spec/), using [00-product](spec/00-product.md), [10-behavior](spec/10-behavior.md), [20-architecture](spec/20-architecture.md), [30-operations](spec/30-operations.md), and [40-validation](spec/40-validation.md). |
| UI and interaction companion | [design/](design/), with a concise overview, screen-state guide, and low-fidelity prototype. |
| Project history | [CHANGELIST.md](CHANGELIST.md). |
| Open backlog | [TODO.md](TODO.md). |
| GitHub Pages and Superpowers process records | [docs/](docs/). Keep `docs/superpowers/` for skill-created design and plan records. |

## Documentation Source Policy

- Markdown is the final source for project documentation and `docs/` remains the non-root GitHub Pages publishing location.
- [README.md](README.md) is the product and repository entrypoint; [spec/README.md](spec/README.md) is the formal documentation entrypoint.
- [spec/](spec/) is the formal source for enduring product, behavior, architecture, operational, and validation contracts. Do not split these contracts back into `plan/`, `platform/`, or `appendix/` trees.
- [design/](design/) records screen hierarchy, user-visible state, and interaction intent. The simple `design/prototype/index.html` is a low-fidelity flow companion, not a pixel-level source of truth.
- Exact CSS, component implementation, schema, SQL, prompt text, and release commands belong to source, tests, or scripts.
- [TODO.md](TODO.md) owns open backlog items only; completed migrations and historical plans belong in [CHANGELIST.md](CHANGELIST.md), not a `progress/` directory.
- Do not recreate generated documentation HTML, CAST JSON sources, `.cast-docs/`, or CAST rendering scripts. Runtime HTML files such as `src/index.html` are application files, not documentation sources.

## Jsonita Product Contracts

- Product scope: a tiny macOS menu-bar JSON toolkit invoked with `Cmd+Shift+J`.
- v1 beta release path: GitHub Releases plus `.dmg` for small internal testing.
- Homebrew Cask, updater, npm wrapper, and broader distribution stay v1.1+ work until release artifacts, stable URLs, and `sha256` values exist.
- API key storage is the app data directory `secrets.json` file with restricted file permissions. Do not reintroduce system Keychain as the product storage path.
- Local data stays local by default: SQLite, settings, window state, and `secrets.json`.
- Logs must not record JSON document content or API keys.
- Version markers must stay aligned across `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`, and the About panel.
- Packaging scripts remain separate entrypoints for macOS DMG, macOS app, Windows NSIS installer, and all-platform builds.

## Validation

- Follow [WORKFLOW.md](WORKFLOW.md) pre-commit checks.
- Documentation-only changes should at least run `git diff --check` and `diff -u AGENTS.md CLAUDE.md`.
- Implementation or Tauri configuration changes should additionally run the relevant subset of `pnpm build`, `pnpm tsc --noEmit`, `cargo check`, `cargo test`, `cargo build`, or `pnpm tauri dev`.
- Avoid dependency installation unless the user asks or validation is blocked by missing local dependencies.
