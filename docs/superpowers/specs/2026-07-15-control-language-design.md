# Control Language Design

**Status:** approved 2026-07-15 (visual direction settled via specimen iteration)

## Intent

Give every user-triggered control in Jsonita one coherent visual language —
Raycast-grade control craft on the existing quiet native-macOS glass identity.
This is a **control-styling** overhaul, not a layout change: screen structure,
the editor, transform tabs, and product terminology stay.

## Visual source of truth

`design/prototype/controls.html` is the authoritative specimen. It carries the
exact CSS values (tokens, radii, strokes, glyph paths) for every control below.
Implementation copies values from the specimen; this doc records the decisions.

## Scope

In scope — every button, shortcut keycap, and setting control across all
surfaces, in one pass: chrome (TabBar), Settings, History, AI Fix, shortcut
permission modal, single-pane hint / window close hints.

Out of scope — command palette / ⌘K root search, transform-tab geometry,
editor layout, a wholesale token/theme redesign.

## Decisions

| Area | Decision |
| --- | --- |
| Modifier glyphs ⌘ ⇧ ↑ ↓ ↵ | All vector, rendered via `<symbol>`/`<use>`, `currentColor`. ⌘ = Apple Bowen-knot path (viewBox 64, stroke 7); ⇧↑↓ drawn (viewBox 24, stroke 2.5); ↵ return = svgrepo path (viewBox 56, stroke 4). Never the unicode character. |
| Keycap text | SF Pro (`--font-ui`), 13px / sm 11 / lg 16, weight 500, letter-spacing 0.01em. (Replaces SF Mono for keycaps.) |
| Keycap tiles | Matte glass: thin border + inset top highlight. Light = white gradient; **dark = flat (no gradient)**, clean matte. Rendered as HTML flex tiles, not SVG text. |
| Commit buttons | **All glass** — translucent surface + thin border + themed text. Primary (Run) = `--surface-raised` + `--border-strong` (glass, emphasized, NOT a solid slab, NOT white text). Secondary = `--control-bg` + `--control-border`. Danger = transparent + border + `--danger` text. Text = borderless. |
| Chrome icon buttons | 34px target, transparent at rest; neutral surface only on hover / focus / selected. split ↔ single view is a **two-button toggle**; plus history, close. |
| Selected / active | Glass (`--surface-raised`), consistent across chrome toggle and any selected row. No solid graphite. |
| Dark theme | Flat frosted glass throughout — **no gradients** (backdrop solid, keycaps flat) so it reads clean, not muddy. |
| Shortcut display | Visual = adjacent matte tiles; `formatAccelerator`'s `⌘ + ⇧ + J` string is retained only as the accessible label / text fallback. |

## Component boundaries

| Component | Responsibility |
| --- | --- |
| `GlyphSymbols` | One hidden `<svg>` declaring the ⌘⇧↑↓↵ `<symbol>` set, mounted once. |
| `ShortcutGlyph` | Render a semantic accelerator (or fixed key) as adjacent matte keycap tiles; accessible label; `decorative` mode. Replaces bare `<kbd>` + `formatAccelerator` string display. |
| `ActionButton` | Glass commit button — `primary` / `secondary` / `danger` / `text` variants, thin border, optional trailing `ShortcutGlyph`. |
| `ChromeIconButton` | 34px icon chrome action with app-rendered tooltip (label + shortcut). Extracted from `TabBar`'s inline `ChromeActionButton`. |

Existing feature components keep their behavior; they only swap presentation
to these primitives.

## Verification

Source-string tests assert the new classes/structure/CSS values exist and the
old ones are gone; `pnpm tsc` + `node --test` + `pnpm build` must pass; visual
QA covers light + dark, all surfaces.
