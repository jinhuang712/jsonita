# P001 · Inline Settings View

## Goal

Make Settings replace the main Jsonita card content instead of rendering as a modal overlay.

## Architecture

Settings is a shell-level page state. `settingsViewOpen` controls whether `FloatingWindow` renders the normal editor workspace or `SettingsView`. History and shortcut permission recovery remain modal overlays.

## Completed Steps

- [x] Rename `SettingsModal` to `SettingsView`.
- [x] Remove fixed overlay, backdrop, `role="dialog"`, and click-outside close from Settings.
- [x] Keep existing group nav, settings patching, reset, and Done behavior.
- [x] Render `SettingsView` inside the main shell when `settingsViewOpen` is true.
- [x] Stop rendering Settings at the root app level.
- [x] Keep `CmdOrCtrl+,` and tray Settings opening the settings page.
- [x] Make `Esc` from settings close the settings page instead of hiding the app.
- [x] Keep editor-only shortcuts disabled while settings is open.
- [x] Replace current Settings Modal language with inline Settings page language across current design, plan, and spec docs.
- [x] Add a changelog entry.

## Verification

- `pnpm tsc --noEmit` passed during implementation.
- Final build, push, Pages deploy, and local app redeploy are tracked in the task run that completed this progress record.
