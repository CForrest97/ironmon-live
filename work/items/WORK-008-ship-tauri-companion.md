---
id: WORK-008
title: Ship the TypeScript-owned Tauri companion
status: in-progress
kind: technical
artifacts:
  - PRD-002
  - DEC-001
---

# Ship the TypeScript-owned Tauri companion

## Intent

Turn the proven local publishing path into the quiet macOS utility described by
PRD-002 without moving website behavior into the companion or introducing
authenticated publishing.

## Outcome

Players can install a Tauri menu-bar companion for Apple Silicon or Intel
macOS 13+, install the bundled Tracker extension into a chosen folder,
understand publication health, recover from transient failures, and accept
cryptographically verified updates distributed through the official website
and R2 domain.

## Context

- [PRD-002](../../docs/product/specs/PRD-002-companion-utility.md)
- [DEC-001](../../docs/decisions/DEC-001-unauthenticated-live-channels.md)
- [Application stack](../../docs/repository/application-stack.md)
- [WORK-007](WORK-007-define-companion-utility.md)

## Scope

Build the companion with Tauri 2 and TypeScript-owned product logic. Keep only
the generated Rust host and plugin registration required by Tauri. Add the
website-owned download route, release infrastructure, and tag workflow. Retain
the unauthenticated five-digit channel and canonical Tracker contract.

Do not add custom Rust logic, player accounts, publisher credentials, emulator
process detection, filesystem search, or automated integration/end-to-end
tests. All browser-facing behavior belongs in `apps/web`.

## Acceptance Criteria

- The companion exposes the seven PRD lifecycle states through one typed state
  model used by settings and the menu bar.
- Live requires fresh valid Tracker state and successful remote publication.
- Pause, login start, Lua folder installation, offline latest-state recovery,
  channel actions, and prompted verified updates are available.
- Existing configuration and channel codes remain compatible.
- The website owns download presentation for separate macOS 13+ arm64 and
  x86_64 artifacts.
- OpenTofu owns the release bucket and custom domain; tag automation refuses to
  overwrite versioned releases and updates the manifest last.
- Focused TypeScript unit and component tests and release smoke checks pass;
  companion integration tests are not required for v1.
- Repository checks and the independent review gate pass.

## Plan

Implement the TypeScript state machine and Tauri adapters, settings and tray UI,
Lua installer, website download route, R2 resources, and release
workflow. Reconcile product and stack documentation, validate locally, then
delegate the complete diff to the independent reviewer.

## Validation

- `npm ci --ignore-scripts` completed successfully.
- `npm run check` passed, including documentation and workflow validation,
  25 repository tests, 14 companion tests, 3 website tests, and 3 contract
  tests.
- `cargo check --locked` passed for the Tauri host with the committed lockfile.
- `npm run build` passed for the companion TypeScript controller, companion
  settings UI, website, contracts, and repository scripts.
- `tofu init -backend=false -reconfigure` and `tofu validate` completed
  successfully once. A later validation attempt was blocked by a local
  Cloudflare provider plugin handshake failure despite the provider binary
  matching the host architecture.
- Native Tauri packaging and the two-machine manual acceptance pass remain
  release prerequisites. Rust and Cargo are now available locally for host
  compilation, but the architecture-specific packaging and acceptance checks
  remain the release workflow's responsibility.
- Independent review found no remaining blocking findings and reported:
  `REVIEW_RATING: 2`, `REVIEW_CONFIDENCE: high`, and
  `HUMAN_APPROVAL_REQUIRED: yes`. Human approval is therefore required before
  merge.
- The first `v0.1.0` release attempt passed repository checks but the native
  build could not read the environment-scoped Tauri signing secrets or updater
  public-key variable. The build job must reference the protected `prod`
  environment that owns those values.
- A later native build rejected `persisted-scope:default` because the plugin
  exposes no capability permissions. The plugin remains registered after the
  filesystem plugin, without an invalid capability entry.
- The `v0.1.6` native build rejected the nonexistent `http:scope` permission.
  HTTP URL allowlists now attach directly to `http:allow-fetch`, and repository
  validation rejects the invalid permission before release.
- The next native build exposed a Tracker extension resource path resolved from
  the `src-tauri` directory instead of the companion directory. The corrected
  path reaches `apps/tracker-extension`, and repository validation now rejects
  missing Tauri bundle resources.
- The `v0.1.8` native build exposed the missing generated Tauri application
  icons, including Tauri's implicit dependency on `src-tauri/icons/icon.png`.
  The corrective release includes the standard icon set, configures bundle
  icons explicitly, and repository validation now rejects missing macOS bundle
  icons before tagging.
- The `v0.1.9` native build exposed that `tauri::generate_context!()` requires
  `serde_json` to be declared directly by the Rust host. The host now declares
  it, and repository validation rejects the missing dependency before release.
  Release `v0.1.10` carries the correction.
- Local verification then exposed that repository-wide ESLint traversed Tauri's
  generated `target` output. ESLint now ignores that build directory, with a
  repository validation test preserving the boundary.
- The `v0.1.10` native build produced its DMG but warned that updater artifacts
  require an updater-enabled target, then removed the temporary app bundle that
  release verification expected. Release `v0.1.11` builds both the macOS `app`
  and `dmg` targets, and repository validation now rejects updater artifact
  configuration without the app target.
- Release publication now uses Wrangler and the existing
  `CLOUDFLARE_DEPLOY_API_TOKEN`; it no longer requires separate AWS-style R2
  release credentials.

## Agent Notes

Tauri requires a generated Rust host and Cargo build. The user explicitly
selected no authored Rust product logic and no automated companion integration
tests for v1.

The maintainer will not use a paid Apple Developer account. V1 DMGs are not
Developer ID signed or notarized, and the download experience must explain the
resulting macOS installation friction. Tauri updater signatures remain required
and are independent of Apple.
