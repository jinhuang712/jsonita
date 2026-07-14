# Documentation Structure Design

**Status:** Approved in the 2026-07-14 Jsonita documentation-cleanup discussion.

## Goal

Make `spec/` the small, durable source of truth for product design and
architecture; make `design/` a lightweight UI companion; retain `docs/` for
GitHub Pages and Superpowers process records.

## Target Structure

```text
spec/
  README.md
  00-product.md
  10-behavior.md
  20-architecture.md
  30-operations.md
  40-validation.md
design/
  README.md
  overview.md
  screens.md
  prototype/index.html
docs/
  superpowers/
```

`TODO.md` remains the open-backlog source and `CHANGELIST.md` remains durable
history. `docs/` is deliberately out of scope for deletion: it is the GitHub
Pages publishing root and the home for Superpowers plans and design records.

## Ownership Rules

- `spec/` records enduring product scope, behavior, architecture, data and
  operational guarantees. It does not duplicate implementation signatures,
  SQL, prompts, release command transcripts, or visual styling.
- `design/` records screen hierarchy, user-visible states, and interaction
  intent. `prototype/index.html` is a deliberately simple, low-fidelity flow
  companion rather than a pixel-level visual source of truth.
- The application source, tests, and scripts own exact styles, component
  internals, schemas, command payloads, prompt text, and release mechanics.
- `docs/superpowers/` records the planning process; it is neither a competing
  product specification nor disposable generated output.

## Migration Rules

1. Rewrite the active content into the five target specifications rather than
   preserving the S/M/I/R/A/V taxonomy or the old plan/spec split.
2. Fold the current completed Settings progress record into `CHANGELIST.md`,
   then remove `progress/`.
3. Extract only current design decisions into `design/overview.md` and
   `design/screens.md`; remove historical explorations, parallel prototypes,
   screenshots, review packets, and handoff artifacts without creating a new
   archive directory.
4. Update all navigation, workflow, agent, TODO, and design-reference tests
   in the same change so no deleted path remains authoritative.

## Verification

Run `git diff --check`, keep `AGENTS.md` and `CLAUDE.md` byte-identical, run
the design-reference Node test, then run the complete Node test suite and the
TypeScript/Vite build.
