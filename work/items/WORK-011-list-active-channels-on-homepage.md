---
id: WORK-011
title: List active channels on the homepage
status: in-progress
kind: product
artifacts:
  - PRD-004
  - DEC-003
---

# List active channels on the homepage

## Intent

Let a homepage visitor see and open a currently active channel without
already holding its code, per the maintainer's direct request.

## Outcome

The homepage renders the current list of active channel codes as links into
the existing live-channel view, backed by a new worker-side registry, while
the manual code-entry form keeps working for anyone who already has a code.

## Context

- [Product brief](../../docs/product/product-brief.md)
- [PRD-004](../../docs/product/specs/PRD-004-list-active-channels-on-homepage.md)
- [DEC-003](../../docs/decisions/DEC-003-list-active-channels-on-homepage.md)
- [DEC-001](../../docs/decisions/DEC-001-unauthenticated-live-channels.md)
- [Domain glossary](../../docs/domain/glossary.md) ("Active run")
- `apps/web/worker/channel.ts` (existing per-channel activation/expiry
  lifecycle the registry must track)

## Scope

Add a `ChannelRegistry` Durable Object that tracks active channel codes
(register on activation, remove on inactivation/expiry), a public worker
endpoint that lists them, and a homepage view that fetches and renders that
list as links, with an explicit empty state. Do not add player names, run
content, search/filter/sort, per-player opt-out, or real-time push updates —
PRD-004's Non-goals exclude all of these for this increment.

## Acceptance Criteria

- PRD-004's acceptance criteria are met: active channels appear as working
  links, an empty list shows an explicit empty state without hiding the
  manual code-entry form, and a channel that becomes inactive stops
  appearing on the next list fetch.
- The registry and list endpoint expose no field beyond the channel code.
- Governed documentation (DEC-003, PRD-004, this work item) and their
  indexes validate cleanly.
- `npm run check` passes.

## Plan

Add the registry Durable Object and wire it into `LiveChannel`'s existing
activate/inactive paths, add a contracts type for the list response, add a
worker endpoint, then update the homepage entry view to fetch and render the
list. Add focused tests for the registry lifecycle, contract parsing, and
homepage rendering before running the full check suite.

## Validation

Recorded once implementation and `npm run check` complete.

## Agent Notes

Per DEC-003, listing is on by default with no per-player control; that
tradeoff is a recorded product decision, not an oversight, and any request to
add opt-out or richer listing detail is a new increment against DEC-003 and
PRD-004, not a change to this work item's scope.
