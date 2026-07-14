# Operations, Privacy, and Release

## Owns

This specification owns the operational guarantees that keep Jsonita local,
recoverable, diagnosable, and releasable.

## Local Data and Privacy

SQLite history, settings, window state, and `secrets.json` remain in the app
data directory. API keys use `secrets.json` with restricted file permissions;
system Keychain is not a product storage path. Logs must never include JSON
document content, API keys, or raw AI prompts and responses.

AI egress is explicit: only a user-started repair request may send current
input to the configured provider. The application must state failures without
revealing the failed document or secret.

## Reliability

The app should remain useful for temporary JSON work if history, settings, or
logs cannot be opened. Defaults may replace unreadable settings; broken durable
state must not be represented as a successful save. Shortcut failure keeps the
menu-bar entry usable. Hide, close, and quit have distinct semantics: hide
preserves the warm workspace, while quit ends the process.

## Logging and Support

Logs exist for support, not document capture. They may record classified event
kind, operation, timing, and safe error summaries. Rolling, export, and repair
mechanics belong to source and scripts; this specification only enforces the
redaction boundary.

## Release Boundary

v1 is a small beta release through GitHub Releases and a macOS `.dmg`.
Version markers across package metadata, Tauri configuration, and the About
surface stay aligned. Packaging entrypoints stay separate for macOS app, macOS
DMG, Windows installer, and all-platform builds. Wider distribution work waits
for stable artifacts, URLs, and checksums.
