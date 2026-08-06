---
id: WORK-012
title: Add a run preview to homepage channel cards
status: in-progress
kind: product
artifacts:
  - PRD-004
  - DEC-004
---

# Add a run preview to homepage channel cards

## Intent

[WORK-011](WORK-011-list-active-channels-on-homepage.md) shipped a code-only
homepage listing under DEC-003, and its Agent Notes flagged that "any request
to add opt-out or richer listing detail is a new increment against DEC-003
and PRD-004." The maintainer directly requested that increment: each
homepage channel card should show a small run preview instead of a bare code.

## Outcome

Each homepage channel card shows a bounded preview — the lead party member's
sprite and name, the current location/route name, and the game — sourced
from the channel's live snapshot, alongside the existing code and live
indicator. [DEC-004](../../docs/decisions/DEC-004-show-a-bounded-run-preview-on-homepage-channel-cards.md)
records the field-set decision and supersedes DEC-003's code-only bound.

## Context

- [WORK-011](WORK-011-list-active-channels-on-homepage.md) (the code-only
  listing this increment extends)
- [DEC-003](../../docs/decisions/DEC-003-list-active-channels-on-homepage.md)
  (superseded by DEC-004)
- [DEC-004](../../docs/decisions/DEC-004-show-a-bounded-run-preview-on-homepage-channel-cards.md)
- [PRD-004](../../docs/product/specs/PRD-004-list-active-channels-on-homepage.md)
  (updated in this change)
- `apps/web/worker/registry.ts`, `apps/web/worker/channel.ts` (existing
  registry this increment extends with a stored preview)

## Scope

Add a `ChannelPreview` contract type and a `derivePreview` function
(`packages/contracts`), extend the registry to store and return a preview
alongside each code, and redesign the homepage's active-channel cards to
render it. Do not add HP, full-party detail, trainer names, battle state,
badges, search/filter, per-player opt-out, or real-time push updates —
PRD-004's Non-goals exclude all of these for this increment.

## Acceptance Criteria

- PRD-004's acceptance criteria are met: each active-channel card shows the
  lead's sprite/name, location, and game where available, a channel with no
  party data yet shows an explicit waiting state, and the preview never
  includes fields DEC-004 excludes.
- A schema-version-1 (legacy) channel degrades gracefully: name only, no
  sprite, no game, location falling back to the legacy route name.
- Governed documentation (DEC-003 superseded, DEC-004, PRD-004, the domain
  narrative and glossary, the product brief, this work item, and their
  indexes) validates cleanly.
- `npm run check` passes.

## Plan

Add the `ChannelPreview` contract and `derivePreview` function first, extend
the worker registry to store and validate it, then redesign the homepage
card component and its styling. Verify visually against `vite`/Wrangler dev
at both desktop and 640px widths before finalizing governed docs.

## Validation

`npm run check` passes: markdown lint, Prettier, ESLint, `tsc`, governed-doc
and workflow validation, 31 repository tests, 17 companion tests, 20 web
tests (including `App.test.tsx`'s lead-preview and waiting-state coverage
and `worker/registry.test.ts`'s preview-carrying registry entries), 11
contract tests (including `derivePreview` for both schema versions and the
legacy route-name/location fallback), and the Chromium 640-CSS-pixel
viewport test.

Manually verified end to end against `vite`'s bundled Wrangler dev: published
schema-version-2 and schema-version-1 snapshots to separate channels,
confirmed `GET /api/channels` returned each channel's bounded preview,
confirmed the homepage rendered both correctly (expanded channel showing
sprite/name/location/game; legacy channel showing name and location-via-route
fallback only), and confirmed the card layout held up with no dead space or
overflow at 640 CSS pixels.

## Agent Notes

An initial draft of this change shipped without asking the maintainer which
fields to show, defaulting to the full party (sprites, HP, aggregate route
count) by inference from the existing channel-view overview. The maintainer
rejected this on two grounds: the field choice was never confirmed with
them, and the result looked poor (excess dead space in the card, numeric HP
unreadable at card scale). Corrected by asking directly; the maintainer's
actual priority order was a single focused lead sprite/name, route, and
game, with HP explicitly cut as low-priority and unreadable at this size.
Lesson generalized into `AGENTS.md`'s learned rules: confirm the exact field
set directly with the requester before building a preview/summary surface,
rather than inferring one from a related but different view.
