# Product Scope

## Owns

This specification owns Jsonita's product promise, release boundary, and the
division of responsibility between `spec/`, `design/`, source code, and
`docs/`.

## Product Promise

Jsonita is a small macOS menu-bar tool invoked with `Cmd+Shift+J`. It lets a
user work on JSON without changing applications: format or minify text, inspect
it as a tree, convert JSON and strings, review local history, and optionally
ask AI to repair invalid JSON.

The product is local-first. User JSON, settings, history, window state, and API
keys remain on the machine unless the user explicitly starts an AI repair
request.

## v1 Scope

- Floating menu-bar window, global shortcut, tray entry, hide and restore.
- Format, minify, tree view, JSON/string conversion, and local history.
- Settings for app behavior, shortcuts, AI, history, transforms, and About.
- Optional AI repair with user review before any input replacement.
- macOS beta distribution through GitHub Releases and a `.dmg`.

## Non-Goals

- Browser product, general-purpose editor, cloud sync, user accounts, or
  collaborative documents.
- Silent or automatic AI repair.
- Homebrew Cask, updater, npm wrapper, or broad distribution before v1.1+.
- A high-fidelity documentation prototype that competes with the application.

## Documentation Authority

- This `spec/` directory owns durable product and architecture decisions.
- [../design/README.md](../design/README.md) owns UI intent and low-fidelity
  flow explanation.
- Source, tests, and scripts own exact behavior and implementation details.
- `docs/` remains the GitHub Pages and Superpowers process location.
- `TODO.md` holds open work; `CHANGELIST.md` holds completed history.
