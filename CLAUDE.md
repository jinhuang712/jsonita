# Agent Instructions

Resolve `<repo-root>` as this checkout, then read and follow [WORKFLOW.md](WORKFLOW.md) before doing repository work.

## Non-Negotiable Bootstrap Rules

1. Do not proceed without loading [WORKFLOW.md](WORKFLOW.md).
2. Avoid broad global searches and large file dumps; use targeted reads.
3. This repo is outside the internal repository root that requires `yummy` / `ym`, so use direct `git -C <repo-root>` commands.
4. Commits in this repository must use the GitHub `jinhuang712` identity, not an internal company identity.
5. If a decision is unclear and affects scope, architecture, rewrite depth, implementation order, release, or user-visible behavior, offer concrete options and ask instead of guessing.
6. Never revert user changes unless the user explicitly asks.

## Jsonita Workflow Mapping

[WORKFLOW.md](WORKFLOW.md) is project-neutral. Apply it to this repository with these Jsonita-specific mappings:

| Workflow Term | Jsonita Path |
| --- | --- |
| `CHANGELOG.md` | [CHANGELIST.md](CHANGELIST.md) |
| `spec/Sxx-*.md` | Active system contracts in [spec/](spec/), from [S00](spec/S00-system-architecture.md) through [S07](spec/S07-packaging-distribution.md). |
| `spec/Mxx-*.md` | Active user-facing capability contracts in [spec/](spec/), currently [M00](spec/M00-frontend-execution.md), [M01](spec/M01-json-engine.md), and [M02](spec/M02-ai-repair.md). |
| `spec/platform/Ixx-*.md` | Active cross-boundary integration contracts in [spec/platform/](spec/platform/README.md). |
| `spec/platform/Rxx-*.md` | Active reliability and runtime operations contracts in [spec/platform/](spec/platform/README.md). |
| `spec/appendix/Axx-*.md` | Numbered implementation details in [spec/appendix/](spec/appendix/README.md). |
| `spec/appendix/Vxx-*.md` | Numbered verification details in [spec/appendix/](spec/appendix/README.md). |
| `progress/Pxxx-*.md` | Use durable history in [CHANGELIST.md](CHANGELIST.md); create `progress/` only for substantial archived records that should not stay in TODO. |

## Documentation Source Policy

- Markdown is the final source for project documentation.
- Do not recreate generated documentation HTML, CAST JSON sources, `.cast-docs/`, or CAST rendering scripts.
- Runtime HTML files such as `src/index.html` and build artifacts are application files, not documentation sources.
- [PROJECT.md](PROJECT.md) is the documentation entrypoint.
- [README.md](README.md) is the product and repository overview.
- [TODO.md](TODO.md) owns open backlog items only. Completed migrations and historical plans belong in [CHANGELIST.md](CHANGELIST.md), not TODO.
- [CHANGELIST.md](CHANGELIST.md) owns durable history for meaningful product, implementation, release, and workflow changes.

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

- Follow [WORKFLOW.md](WORKFLOW.md) pre-commit checks, using `CHANGELIST.md` wherever the workflow says `CHANGELOG.md`.
- Documentation-only changes should at least run `git diff --check` and `diff -u AGENTS.md CLAUDE.md`.
- Implementation or Tauri configuration changes should additionally run the relevant subset of `pnpm build`, `pnpm tsc --noEmit`, `cargo check`, `cargo test`, `cargo build`, or `pnpm tauri dev`.
- Avoid dependency installation unless the user asks or validation is blocked by missing local dependencies.
