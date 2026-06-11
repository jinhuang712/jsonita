# Jsonita Design Corpus

This folder is the single home for Jsonita UI, visual design, interaction, prototype, accessibility, and implementation-facing design material.

## Agent Reading Order

1. `../design/01_mockups.md` is the visual authority for the app surface and key state screens.
2. `../design/02_interaction.md` explains the interaction model, keyboard flow, settings, history, and status-bar behavior.
3. `03_design_tokens.md` defines color, typography, spacing, motion, layering, and theme rules.
4. `04_components.md` maps UI components and reusable states.
5. `05_icons_theme.md` owns icon resources, menu-bar assets, and theme adaptation rules.
6. `06_window.md`, `07_menubar.md`, and `08_editor.md` cover platform integration and runtime UI behavior.
7. `14_i18n_a11y.md` owns internationalization, keyboard, and accessibility constraints.

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
