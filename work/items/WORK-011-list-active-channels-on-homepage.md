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

`npm run check` passes: markdown lint, Prettier, ESLint, `tsc`, governed-doc
and workflow validation, 31 repository tests, 17 companion tests, 19 web
tests (including `worker/registry.test.ts`'s active/expired code-filtering
coverage and `App.test.tsx`'s homepage active/empty-list rendering
coverage), 6 contract tests, and the Chromium 640-CSS-pixel viewport test.

Manually verified end to end against `vite`/Wrangler dev: `GET
/api/channels` returns `{"channels":[]}` before any publish; after a `PUT
.../publish` with a snapshot message, the code appears in the list; the
homepage renders it as a working link into `/channel/:code`.

Consistent with `LiveChannel`, `ChannelRegistry`'s own request routing has no
automated test (no Workers-runtime test harness exists in this repository);
only the pure `activeCodes` filtering function is unit-tested.

### 2026-08-05: review-gate findings and fixes

An independent review pass (risk-reviewer, product-fit-reviewer,
domain-consistency-reviewer) found:

- **Blocking (risk-reviewer)**: `registerActive`/`unregisterActive` awaited a
  cross-DO fetch to the single `ChannelRegistry` singleton synchronously on
  every publish (companion heartbeats every ~2s per channel), with no error
  handling — a slow or failing registry could fail the primary publish path.
  Fixed: registration now throttles to once per 60 seconds per channel (via a
  stored `lastRegisteredAt`) and fires the cross-DO call through
  `ctx.waitUntil` with errors swallowed, so it never blocks or fails a
  publish; the list endpoint also gained a 5-second `cache-control` to reduce
  read load on the singleton.
- **Blocking (domain-consistency-reviewer)**: `docs/domain/narrative.md`
  still stated "The product does not offer search or public discovery of
  channels," which this change makes false. Fixed by updating that
  paragraph to describe the homepage listing and link DEC-003; also added an
  "Active channel" glossary entry since the term was used pervasively
  without a definition, and cross-referenced DEC-003 from PRD-003's now-stale
  "public channel discovery" non-goal.
- **Non-blocking**: registry input validation coerced `code` via `String()`
  before validating instead of checking `typeof`; tightened to reject
  non-string/non-finite input outright. Homepage channel links unconditionally
  called `preventDefault()`, swallowing Cmd/Ctrl/Shift-click; fixed to only
  intercept plain left-clicks. PRD-004's acceptance criteria overstated test
  coverage of the registry's DO-level behavior; reworded to name exactly what
  is and is not covered.

product-fit-reviewer found the change fully aligned with PRD-004 (no
blocking findings). risk-reviewer's residual concern — that public listing
itself is a deliberate privacy-model reversal — is the recorded tradeoff in
DEC-003, not a defect, and is called out for human approval below rather than
fixed in code.

Per `AGENTS.md`'s review gate, this is a product/domain-governance change, so
human approval is required before merging regardless of the fixes above.

## Agent Notes

Per DEC-003, listing is on by default with no per-player control; that
tradeoff is a recorded product decision, not an oversight, and any request to
add opt-out or richer listing detail is a new increment against DEC-003 and
PRD-004, not a change to this work item's scope.
