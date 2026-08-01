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
  19 repository tests, 14 companion tests, 3 website tests, and 3 contract
  tests.
- `npm run build` passed for the companion TypeScript controller, companion
  settings UI, website, contracts, and repository scripts.
- `tofu init -backend=false -reconfigure` and `tofu validate` completed
  successfully once. A later validation attempt was blocked by a local
  Cloudflare provider plugin handshake failure despite the provider binary
  matching the host architecture.
- Native Tauri packaging and the two-machine manual acceptance pass remain
  release prerequisites. This workstation does not have Rust, Cargo, or Xcode
  available, so it cannot perform those checks.
- Independent review found no remaining blocking findings and reported:
  `REVIEW_RATING: 2`, `REVIEW_CONFIDENCE: high`, and
  `HUMAN_APPROVAL_REQUIRED: yes`. Human approval is therefore required before
  merge.

## Agent Notes

Tauri requires a generated Rust host and Cargo build. The user explicitly
selected no authored Rust product logic and no automated companion integration
tests for v1.

The maintainer will not use a paid Apple Developer account. V1 DMGs are not
Developer ID signed or notarized, and the download experience must explain the
resulting macOS installation friction. Tauri updater signatures remain required
and are independent of Apple.
