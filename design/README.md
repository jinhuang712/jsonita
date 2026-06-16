# Jsonita Design Corpus

This folder is the single home for Jsonita UI, visual design, interaction, prototype, accessibility, and implementation-facing design material.

## Agent Reading Order

1. `../design/prototype/index.html` is the front-end UI source of truth for visual layout, real-size high-fidelity surfaces, state branches, theme behavior, and clickable prototype interactions.
2. `../design/01_mockups.md` explains the app surface and key state screens in prose.
3. `../design/02_interaction.md` explains the interaction model, keyboard flow, settings, history, and status-bar behavior.
4. `03_design_tokens.md` defines color, typography, spacing, motion, layering, and theme rules.
5. `04_components.md` maps UI components and reusable states.
6. `05_icons_theme.md` owns icon resources, menu-bar assets, and theme adaptation rules.
7. `06_window.md`, `07_menubar.md`, and `08_editor.md` cover platform integration and runtime UI behavior.
8. `14_i18n_a11y.md` owns internationalization, keyboard, and accessibility constraints.

## Prototype Source of Truth

`../design/prototype/index.html` is a hand-maintained, single-file prototype. It is not generated documentation and must not be removed as part of CAST or Markdown cleanup.

Use it as the front-end UI source of truth when implementation details involve:

- real 860 x 560 floating window size and page-level layout;
- light / dark theme behavior;
- page navigation between Main Window, AI Fix, Settings, History, Menu Bar, Permissions, Empty States, and Search / Editor;
- state matrix branches such as input validity, active tab, single-pane mode, AI repair flow, Settings section, History state, permission state, search state, and Esc hint;
- clickable prototype interactions and visual hierarchy.

Markdown files remain the durable explanation layer. If the prototype and Markdown disagree about visual or interaction details, update both, but implement the front-end against `../design/prototype/index.html`.

## Prototype Sources

The legacy prototype HTML pages were migrated into Markdown with their visible text preserved. Prototype documents that relied on inline CSS or dense HTML also include preserved source sections at the bottom:

- `../design/01_mockups.md`
- `03_design_tokens.md`
- `05_icons_theme.md`
- `jsonita-design-explorations.md`
- `jsonita-glass-hero-light-dark.md`
- `jsonita-glass-mockups.md`
- `jsonita-motion-demo.md`
- `jsonita-settings-detail.md`
- `jsonita-singlepane-statusbar-demo.md`

Coding agents should read the rendered prose first, then inspect the preserved source blocks only when exact visual layout, CSS token usage, or prototype structure matters.
