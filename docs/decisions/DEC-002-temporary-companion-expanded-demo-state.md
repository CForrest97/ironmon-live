---
id: DEC-002
title: Temporarily publish companion-expanded demo state
status: accepted
category: product
supersedes: []
---

# Temporarily publish companion-expanded demo state

## Context

PRD-003 needs a version 2 snapshot to exercise the expanded player-first
channel, but the bundled Tracker extension currently emits only version 1
party and route state. The maintainer explicitly chose a temporary companion
bridge that supplies a fixed active-battle profile and other missing expanded
values as ordinary available state rather than leaving the expanded page empty.

## Decision

When a companion receives a version 1 snapshot, it shall publish a deterministic
version 2 expansion. It shall retain the version 1 party and route facts where
they exist and synthesize only fields not supplied by version 1, including a
single active trainer battle. Native version 2 snapshots pass through unchanged.

The bridge is temporary and shall be removed when the bundled Tracker extension
emits schema-version-2 snapshots.

## Consequences

- The expanded channel is usable while the extension remains on version 1.
- Synthesized values may not represent the player's current game state; this is
  an explicit temporary product trade-off.
- Contract, companion, and web tests must retain version 1 compatibility and
  distinguish unavailable values for native version 2 producers.

## Alternatives

- Leave every field unavailable until the extension exports version 2. This
  preserves strict source truth but does not exercise the requested dashboard.
- Change the Lua extension as part of this delivery. That would expand the
  unvalidated Tracker integration rather than provide the requested short-term
  companion bridge.

## Supersedes

None.

## Open Questions

None.
