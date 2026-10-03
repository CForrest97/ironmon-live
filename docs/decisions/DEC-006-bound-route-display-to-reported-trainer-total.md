---
id: DEC-006
title: Bound route display to the reported trainer total
status: accepted
category: product
supersedes: []
---

# Bound route display to the reported trainer total

## Context

[PRD-003](../product/specs/PRD-003-expand-player-first-live-channel.md)
requires the route view to show the reported completed and total trainer count,
as well as reported trainer state. A maintainer supplied a Route 101 snapshot
with `completed: 0`, `total: 0`, and an empty trainer list, while the viewer
showed a visual track of unbattled trainer markers below `0/0 trainers`.

The contract carries the total and trainer list as separate reported values but
does not establish a reconciliation rule if they disagree. Treating a list as
the display count would contradict a reported zero; deriving a new count from
the list would replace a reported fact with an inferred one.

## Decision

The reported non-negative route `total` bounds the route presentation. The
overview progress track and Route-panel trainer rows shall render no more than
that total number of reported trainers. When `total` is zero, both surfaces
render no trainer markers or rows.

This is a presentation bound only. It does not change the published snapshot,
declare omitted trainers nonexistent, or infer a replacement total from the
list. A conflict can therefore hide detailed trainer entries until upstream
reported values become self-consistent.

## Consequences

- A visible `0/0` route cannot also show unbattled trainer markers or rows.
- The overview and Route panel remain consistent with the count presented to
  the player.
- In a conflicting snapshot, detailed trainer information above the reported
  total is temporarily not shown rather than being used to manufacture a
  different count.
- The Tracker, contracts, companion, Worker, and delivery protocol remain
  unchanged.

## Alternatives

- **Trust the trainer list as the display count**: rejected because it can
  contradict the separately reported total, as in the maintainer's `0/0`
  report.
- **Derive a replacement total from the list**: rejected because it would turn
  reported trainer detail into an inferred count.
- **Add a conflict-warning surface**: deferred because it is a new user-facing
  state beyond the requested consistency fix.
- **Reconcile the values in the Tracker extension**: deferred because the
  reported bug requires an immediate, presentation-only safeguard and does not
  establish the upstream cause.

## Supersedes

None.

## Open Questions

None.
