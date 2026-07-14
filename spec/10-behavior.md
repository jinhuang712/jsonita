# Product Behavior

## Owns

This specification owns user-visible behavior and the rules that protect user
input. It does not own page layout, component styling, or low-level command
contracts.

## Entry and Workspace

The global shortcut and menu-bar entry show or hide one compact workspace.
Hiding is not quitting: current in-memory editing state stays available until
the user explicitly quits. Settings and History replace the workspace inside
the same app shell; they are not separate long-lived application windows. When
the editor workspace is shown, input focus returns to the editable document so
the active transform tab does not receive focus by default.

## JSON Work

Users can format, minify, inspect a tree, convert JSON to a string, and parse a
string back to JSON. Normal editing produces a preview and status feedback, but
preview never replaces the input. Replacing input requires an explicit user
action such as applying a single-pane result, accepting AI output, or clearing
the document.

Invalid and large inputs remain editable. Tree view is a read-only view of the
current input and must not show stale data after the input becomes invalid.

## AI Repair

AI repair is optional and user-triggered. It requires enabled AI, a stored key,
and current input; it sends only the requested document to the configured
provider. A response must pass local JSON validation and be shown for user
review. Accept is the only action that may replace input; cancellation, provider
failure, rate limiting, or invalid model output keep the original text.

## Local History and Settings

History is local and only records successful, authorized work. Settings show
the durable state held by the host; failed saves must not look successful.
Shortcut conflicts or permissions must leave a usable menu-bar path and expose
an actionable recovery path.

## User-Facing Failure Rules

- Do not lose editable input because preview, persistence, or AI fails.
- Do not report success when a transform, storage update, or AI request fails.
- Do not expose JSON text or API keys in messages or logs.
- Keep keyboard actions predictable: local editing actions win before an
  Escape action hides the window.

Screen structure and visible states are summarized in
[../design/screens.md](../design/screens.md).
