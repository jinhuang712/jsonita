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
| [spec/README.md](spec/README.md) | Spec 入口、核心/附录边界、主权对象地图和写作规则。 |
| [spec/00_system_architecture.md](spec/00_system_architecture.md) | Process model, layering, module ownership, data flow, and cross-cutting invariants. |
| [spec/01_runtime_lifecycle.md](spec/01_runtime_lifecycle.md) | Startup, tray/shortcut entry, show/hide/focus, quit, and restore lifecycle. |
| [spec/02_frontend_execution.md](spec/02_frontend_execution.md) | Editor store, panes, preview/apply behavior, Tree view, AI pane, and visible state. |
| [spec/03_ipc_boundary.md](spec/03_ipc_boundary.md) | Frontend/Rust command and event boundary, async semantics, payload limits, and authority. |
| [spec/04_error_model.md](spec/04_error_model.md) | Unified failure semantics, recoverability, UI obligations, and retry boundaries. |
| [spec/05_security_privacy.md](spec/05_security_privacy.md) | Local data boundary, secrets, AI egress, logging privacy, permissions, and trust assumptions. |
| [spec/06_json_engine.md](spec/06_json_engine.md) | JSON transform contract, parse location, stringify/unwrap behavior, and performance boundary. |
| [spec/07_storage_session.md](spec/07_storage_session.md) | SQLite, settings, window state, secrets, history, and last-session ownership. |
| [spec/08_ai_repair.md](spec/08_ai_repair.md) | DeepSeek repair flow, prompt boundary, response validation, Diff decision state, and failures. |
| [spec/09_logging_observability.md](spec/09_logging_observability.md) | Local log boundary, redaction, rolling files, event classes, export, and support workflow. |
| [spec/10_packaging_distribution.md](spec/10_packaging_distribution.md) | Build artifacts, signing/notarization, release channels, and future distribution boundaries. |
| [spec/appendix/README.md](spec/appendix/README.md) | Schema、命令、事件、SQL、prompt、配置、发布和测试明细附录。 |

### Design

Start with [design/README.md](design/README.md). UI, interaction, visual, prototype, token, icon, window, menu-bar, editor, i18n, and accessibility material lives under `design/`.
