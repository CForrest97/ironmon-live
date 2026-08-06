---
id: DEC-003
title: List active channels on the homepage by default
status: superseded
category: product
supersedes: []
---

# List active channels on the homepage by default

## Context

The [product brief](../product/product-brief.md) originally excluded
"searching, browsing, or publicly listing players or live channels" as a
non-goal, and [PRD-003](../product/specs/PRD-003-expand-player-first-live-channel.md)
repeated that exclusion for its own scope. Under that non-goal, a channel is
reachable only by someone who already holds its five-digit code.
[DEC-001](DEC-001-unauthenticated-live-channels.md) established that this
code is an unauthenticated, guessable identifier and not a security
credential, but it is still the only thing standing between "known to the
people the player shared it with" and "known to anyone."

The maintainer requested a homepage feature that shows every currently active
channel so a visitor can see what is live without first receiving a code.
This directly contradicts the existing non-goal and narrows the practical gap
DEC-001 left open, so it requires a recorded decision rather than a quiet
implementation change.

## Decision

The homepage lists every channel with an active run (a channel whose
companion has supplied a heartbeat within the expiry window, per the
glossary's "Active run" definition), by default and without any per-player
opt-in or opt-out action.

Each listed entry exposes only the channel's five-digit code. The list
includes no player name, run content, party, route, or other
snapshot-derived detail — the acceptance criteria in
[PRD-004](../product/specs/PRD-004-list-active-channels-on-homepage.md)
govern the exact fields.

This decision replaces the prior "searching, browsing, or publicly listing
players or live channels" non-goal recorded in the product brief; that
document, and the domain narrative's matching invariant, are updated in the
same change as this record. (The `## Supersedes` section below concerns only
prior `DEC-###` decision records, per this document type's convention; this
record supersedes none.)

## Consequences

- Any visitor to the homepage can now discover which channel codes are
  currently live without being given a code by the player. This removes the
  practical discoverability gap that channel codes previously left in place,
  even though DEC-001 already established the codes were never a security
  boundary.
- A player who wants their run to stay reachable only by people they
  personally share a code with no longer has that assurance from the product
  by default; there is no per-player control to opt out of listing.
- The registry that tracks active codes is new backend state (a small
  Durable Object or equivalent), distinct from and simpler than any
  per-channel snapshot storage; it must not retain or expose snapshot
  content.
- DEC-001's open question about when misuse of an unauthenticated code
  "would justify stronger channel ownership or access controls" becomes more
  pressing, since discovery no longer requires having been given the code.
  That question remains open in the product brief.

## Alternatives

- **Opt-in listing per player**: a player would explicitly choose to appear
  on the homepage list, preserving today's effectively-private default for
  everyone who does not opt in. Rejected for this decision because the
  requested feature is for every active channel to be visible by default;
  opt-in listing would need companion or contract changes to carry a
  player-set preference, which is a larger increment than requested.
- **Richer listing (player-chosen display name, run summary)**: entries
  would show more than a bare code, making the list more useful for
  browsing. Rejected for this decision because it exposes more
  player-identifying and run-content information than the requested feature
  calls for; it remains available as a future increment if evidenced.
- **No homepage listing (status quo)**: rejected because it does not satisfy
  the requested feature.

## Supersedes

None.

## Open Questions

None.
