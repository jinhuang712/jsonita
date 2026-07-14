# Jsonita Design Companion

`design/` is a small companion to the formal specifications in `../spec/`.
It explains user-visible screen structure and interaction intent; it does not
duplicate CSS, component internals, or visual explorations.

## Read in This Order

1. [overview.md](overview.md) for the product-facing visual direction and
   ownership boundary.
2. [screens.md](screens.md) for the active screens, states, and interaction
   constraints.
3. `design/prototype/index.html` for a simple clickable flow through the four
   main workspace states.

## Authority

The prototype is deliberately low fidelity. It helps discuss navigation and
state changes; it is not a full-size canvas or a pixel-level source of truth.
Exact tokens, styles, component structure, localization, and accessibility
implementation live in the application source and tests.

When a behavior changes, update `../spec/10-behavior.md` first, then update
this companion only if the user-visible screen or flow changes.
