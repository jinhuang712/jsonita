# Screens and Interaction Intent

## Editor Workspace

The editor workspace is the default surface. It exposes JSON transforms, Tree,
AI Fix when relevant, History, Settings, search, status feedback, and split or
single-pane work. Editing may update preview and status, but no preview may
replace input without an explicit user action.

Empty, invalid, large-input, Tree, search, and single-pane states must retain a
clear next action. Tree is a read-only view of current input and must not show
stale data. Search keeps Find and Replace in the same docked panel.

## Settings and History

Settings and History replace the editor workspace inside the same shell; they
are not nested modal cards. Closing either returns to editing. Settings presents
the durable state reported by the host. History remains local and makes its
empty, search, and pinned states understandable without exposing document
contents in logs or unrelated UI.

## AI Fix

AI Fix has five visible moments: unavailable prerequisites, explicit request,
waiting, reviewable Diff, and a failure or accepted result. Waiting feedback
must be obvious; a Diff presents Accept and rejection paths. Only Accept can
replace input. Failure keeps input editable and offers a safe next action.

## Global Interaction

`Cmd+Shift+J` and the menu bar show or hide the tool. Hiding preserves the warm
workspace; quitting ends the process. `Esc` first resolves the active local
editing state, then may hide the window according to the product behavior.
Shortcut problems must leave the menu-bar path usable. When the editor
workspace is shown, keyboard focus lands in the input editor rather than a
transform tab, so users can paste or type immediately.

## Scope Boundary

This guide owns visible intent, not CSS or component implementation. Product
behavior lives in [../spec/10-behavior.md](../spec/10-behavior.md); architecture
and privacy boundaries live in the other formal specifications.
