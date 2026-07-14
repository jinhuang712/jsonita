# Design Overview

## Purpose

Jsonita should feel like a quiet, native macOS utility: fast to summon,
keyboard-friendly, compact, and clear about local privacy and AI boundaries.
The UI serves JSON work; it is not a dashboard or a marketing surface.

## Working Principles

- Keep one compact workspace with obvious transform, history, and settings
  entry points.
- Let the editor and current document remain the visual focus.
- Keep transform selection feedback stable: the active pill and color may move,
  but switching tabs must not reflow the surrounding chrome.
- Keep Settings and History as workspace pages, not cards stacked over the
  editor.
- Present AI repair as a distinct review flow, never as an automatic rewrite.
- Make empty, invalid, loading, and permission states explain the next useful
  action without inserting text into the document.
- Use short, operational copy and macOS key glyphs where the running app uses
  them.

## Implementation Boundary

The application source owns visual details. In particular,
`src/styles/tokens.css`, component styles, editor extensions, locale resources,
and tests determine exact colors, spacing, motion, icons, accessibility, and
responsive behavior. This file intentionally does not repeat those values.

The low-fidelity flow at `design/prototype/index.html` exists only to make the
main navigation and user decisions easy to discuss.
