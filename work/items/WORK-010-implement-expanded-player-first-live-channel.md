---
id: WORK-010
title: Implement the expanded player-first live channel
status: in-progress
kind: product
artifacts:
  - PRD-003
  - DEC-002
---

# Implement the expanded player-first live channel

## Intent

Deliver PRD-003's progressive-disclosure player channel while the bundled
Tracker extension remains limited to schema version 1.

## Outcome

The companion publishes deterministic schema-version-2 expanded state for
version 1 input, and the website presents a compact live overview with Party,
Battle, Route, and Progress detail panels.

## Context

- [PRD-003](../../docs/product/specs/PRD-003-expand-player-first-live-channel.md)
- [DEC-002](../../docs/decisions/DEC-002-temporary-companion-expanded-demo-state.md)
- [Tracker extension capability inventory](../../apps/tracker-extension/capability.md)

## Scope

Add strict version 2 contracts, the temporary companion bridge, the player
dashboard, sprite fallbacks, responsive automated coverage, and focused tests.
Keep the Lua extension on version 1; do not add randomizer data, bag data,
encounter history, accounts, or retained run history.

## Acceptance Criteria

- Direct version 1 messages and channel rendering remain valid.
- Version 1 companion input is normalized deterministically to version 2;
  native version 2 snapshots remain unchanged.
- The overview and all named detail panels work at 640 CSS pixels without
  horizontal scrolling.
- Failed imagery preserves readable state information.
- `npm run check` passes.

## Plan

Implement the versioned contract and bridge before replacing the web view, then
validate strict parsing, availability semantics, responsive layout, and image
fallback behavior.

## Validation

`npm run check` passes Markdown and TypeScript checks, governed-document and
workflow validation, 31 repository tests, 17 companion tests, 6 web component
tests, 5 contract tests, and the Chromium 640-CSS-pixel viewport test.

## Agent Notes

The required scenario sessions with active IronMON players remain outstanding.
Record findings before treating the information hierarchy as player-validated.
