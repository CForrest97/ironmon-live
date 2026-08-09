---
name: tauri-packaging
description: Apply this repository's Tauri native-packaging lessons when creating or modifying files under apps/companion, including capabilities, HTTP permissions, bundle resources, icons, code signing, and CI packaging. Do not load for changes outside the Tauri companion.
---

# Tauri packaging

These rules were learned the hard way while shipping the companion app
(`WORK-008`). Fold a new Tauri lesson into this list, merging overlapping
bullets, instead of restating it in `AGENTS.md`.

- Do not grant capability identifiers to Tauri plugins that expose no commands
  or permissions.
- Attach Tauri HTTP URL allowlists to `http:allow-fetch`; `http:scope` is not
  a permission.
- Tauri scoped HTTP fetch requires explicit permissions for its entire request
  lifecycle.
- Resolve Tauri bundle resources from the directory containing
  `tauri.conf.json`.
- Grant and validate explicit Tauri window capabilities for every menu-bar
  window action.
- Generate, explicitly configure, and validate Tauri application icons before
  tagging a native release.
- Declare and validate `serde_json` as a direct Rust dependency when using
  Tauri's generated context macro.
- Build the Tauri macOS `app` target whenever updater artifacts are enabled.
- Strictly verify the completed macOS app-bundle signature before publishing a
  DMG.
- Explicitly set `CI=true` for headless Tauri DMG packaging so its script
  skips Finder automation.
- Exclude Tauri build output from repository-wide linting.
