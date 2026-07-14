# Validation

## Owns

This specification owns the minimum evidence required before a change is
considered integrated. It selects verification by change risk rather than
requiring every command for every documentation edit.

## Documentation Changes

Run:

```bash
git diff --check
diff -u AGENTS.md CLAUDE.md
```

Check that Markdown links exist, `README.md` and `spec/README.md` point to the
current specification map, completed work is not left in `TODO.md`, and the
GitHub Pages / Superpowers `docs/` role remains intact.

## UI or Prototype Changes

Run the focused Node test that checks the documented prototype contract, then
the complete Node suite when its assertions or shared design guidance changed.
The prototype is a low-fidelity flow aid; its test verifies ownership and basic
states rather than visual pixel parity.

## Frontend and Tauri Changes

Use the smallest relevant combination of `pnpm tsc --noEmit`, `pnpm build`,
focused Node tests, `cargo check`, `cargo test`, `cargo build`, or `pnpm tauri
dev`. Do not install dependencies unless the task requests it or a missing local
dependency blocks validation.

## Release Changes

Verify version alignment, target-specific packaging scripts, artifact naming,
and privacy constraints. For a UI/runtime change intended for local use, rebuild
the Tauri application rather than treating a browser bundle as the only proof.
