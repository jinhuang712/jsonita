# Architecture

## Owns

This specification owns system responsibilities, cross-layer data flow, and
non-negotiable invariants. Exact APIs, payload types, and storage schemas live
with the code and tests that enforce them.

## Two Execution Worlds

| Layer | Responsibility |
| --- | --- |
| React WebView | Visible editor, pane and page state, local interaction feedback, and explicit user decisions. |
| Rust/Tauri host | JSON engine, persistence, system integration, AI HTTP, local logs, window and menu-bar behavior. |

The WebView may cache visible state but never treats that cache as durable
storage. Host services cannot silently change editor input; they return results
for the WebView to present and the user to accept when required.

## Main Data Flows

1. **Local transform:** editor input reaches the JSON engine through the host;
   the result updates a preview. Only an explicit apply action changes input.
2. **AI repair:** a user request crosses to the host, the response is locally
   validated, then the WebView offers a review decision before replacement.
3. **Persistence and restore:** successful authorized work can update local
   history or session state; window and settings state restore independently.

## Invariants

- User input is the visible editing truth until an explicit replacement action.
- Preview, stale async responses, transport errors, and invalid AI output
  cannot overwrite user input.
- Local data and secrets do not cross process boundaries unless the user starts
  the permitted operation.
- A window hide preserves the active session; quit ends the process and later
  restoration uses only durable data.
- Errors are classified before presentation so callers can give a safe,
  actionable result without logging sensitive content.

## Boundaries

The architecture does not specify visual layout or styling. It also does not
copy command signatures, SQL, prompt text, or release shell commands; those are
implementation-owned details.
