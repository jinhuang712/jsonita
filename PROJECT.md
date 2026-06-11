# Jsonita Project Documentation

Owner: Jin Huang

Jsonita is a tiny macOS menu-bar JSON toolkit that appears instantly from a global shortcut.

## Reader Entry Points

| Path | Purpose |
| --- | --- |
| [README.md](README.md) | Product introduction, installation, usage, release scripts, and repository overview. |
| [TODO.md](TODO.md) | Current open backlog, risks, deferred decisions, and readiness blockers. |
| [CHANGELIST.md](CHANGELIST.md) | Durable project change history. |
| [WORKFLOW.md](WORKFLOW.md) | Repository workflow and agent operating rules. |
| [plan/](plan/) | Product plan and non-UI product contracts. |
| [spec/](spec/) | Technical architecture and non-UI implementation contracts. |
| [design/](design/) | UI, visual design, interaction, prototype, accessibility, and design-token material. |

## Product Boundary

| Topic | Current Contract |
| --- | --- |
| v1 release | Use GitHub Releases plus a `.dmg` for small beta testing first. Homebrew, updater, and npm wrapper stay v1.1+ work. |
| Install entry | Use README source-build commands during development; beta users download the `.dmg` from GitHub Releases. |
| Privacy boundary | User data stays local: SQLite, settings, window state, and `secrets.json`. Logs do not record JSON content or API keys. |
| API key storage | API keys live in the app data directory `secrets.json` with restricted permissions. Do not reintroduce system Keychain as product storage. |

## Document Map

### Plan

| Path | Purpose |
| --- | --- |
| [plan/00_overview.md](plan/00_overview.md) | Product positioning, constraints, and documentation authority boundaries. |
| [plan/01_features.md](plan/01_features.md) | v1.0 scope, feature list, non-goals, and later roadmap. |
| [plan/03_tech_stack.md](plan/03_tech_stack.md) | Technology choices such as Tauri, React, SQLite, local secrets, DeepSeek, and packaging trade-offs. |
| [plan/04_nfr.md](plan/04_nfr.md) | Performance, privacy, security, usability, compatibility, reliability, observability, and distribution constraints. |

### Spec

| Path | Purpose |
| --- | --- |
| [spec/00_architecture.md](spec/00_architecture.md) | Process model, module boundaries, data flow, errors, and directory structure. |
| [spec/02_ipc.md](spec/02_ipc.md) | Frontend/Rust command, event, payload, and performance contracts. |
| [spec/09_json_engine.md](spec/09_json_engine.md) | JSON format, minify, string conversion, nested unwrap, error location, and performance behavior. |
| [spec/10_storage.md](spec/10_storage.md) | SQLite, settings, session state, `secrets.json`, migrations, and corruption recovery. |
| [spec/11_ai_client.md](spec/11_ai_client.md) | DeepSeek repair flow, prompt boundary, JSON extraction, errors, diff, and test connection. |
| [spec/12_packaging.md](spec/12_packaging.md) | Tauri config, capabilities, DMG/APP/NSIS, signing, notarization, GitHub Release, and later Homebrew. |
| [spec/13_schemas.md](spec/13_schemas.md) | Core data models, settings, IPC, SQLite schema, window state, and secrets schema. |
| [spec/15_logging.md](spec/15_logging.md) | Logging boundary, redaction, rolling files, event catalog, export, and support workflow. |

### Design

Start with [design/README.md](design/README.md). UI, interaction, visual, prototype, token, icon, window, menu-bar, editor, i18n, and accessibility material lives under `design/`.
