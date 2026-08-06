---
id: PRD-004
title: List active channels on the homepage
status: accepted
contexts: []
decisions: [DEC-003, DEC-004]
---

# List active channels on the homepage

## Problem

Today the homepage only offers a form for typing a five-digit channel code
you already have; there is no way to see what is currently live. A visitor
who was not personally handed a code cannot find any active run.

## Evidence

The maintainer requested this feature directly as a product change. No
discovery interviews or usage data support a specific adoption or usability
target; this specification proceeds on direct maintainer request rather than
validated evidence, consistent with how the original MVP scope in
[PRD-001](PRD-001-live-player-companion.md) began.

## Users

Any homepage visitor, including people who have never received a channel
code, and existing players whose active runs become visible to that visitor
by default under [DEC-003](../../decisions/DEC-003-list-active-channels-on-homepage.md),
including the bounded run preview added by
[DEC-004](../../decisions/DEC-004-show-a-bounded-run-preview-on-homepage-channel-cards.md).

## Desired Outcomes

- A visitor on the homepage can see every currently active channel, with a
  small preview of its run, and open one without needing to have been given
  the code beforehand.
- The list reflects active runs closely enough to be useful: a channel
  appears once its run becomes active and disappears once that run expires,
  consistent with the glossary's "Active run" definition.

## Non-goals

- Showing player names, HP or any other party-member stat, trainer names or
  portraits, battle state, badges, or any snapshot-derived detail beyond the
  bounded preview fields DEC-004 names (the lead party member's species and
  name, the current location/route name, and the game).
- Search, filtering, sorting by popularity, or pagination of the list.
- A per-player opt-in or opt-out control for appearing in the list or its
  preview.
- Real-time push updates to an open homepage; a page load or explicit refresh
  is sufficient for this increment.

## Scope

Add a worker-side registry of currently active channel codes and their
bounded run preview, a public endpoint that returns that list, and a
homepage view that fetches and renders it as preview cards linking into the
existing `/channel/:code` view, alongside the existing manual code-entry form
(which remains for anyone who already has a code and prefers to type it, or
whose channel is not yet active).

## Requirements

- The worker maintains a registry of channel codes with an active run, kept
  in sync with each channel's existing activation and expiry lifecycle
  (`LiveChannel`'s publish/inactive/alarm behavior in
  `apps/web/worker/channel.ts`). The registry stores a channel's code, expiry,
  and its bounded preview (per DEC-004); it stores no other snapshot content
  or player name.
- Each channel's preview is derived from its current snapshot through a
  single shared function (`derivePreview` in `packages/contracts`), so every
  call site enforces the same bounded field set.
- A public endpoint returns the current list of active channels, each with
  its code and preview. It requires no authentication, matching the
  unauthenticated channel model from DEC-001.
- The homepage entry view fetches this list once on load and renders each
  entry as a card linking to that channel's `/channel/:code` view, showing
  its preview.
- If the list is empty, the homepage says so rather than showing a blank
  area, and the manual code-entry form remains available regardless of list
  contents.
- A channel that expires (no heartbeat within the expiry window) is removed
  from the registry and stops appearing in the list on the next load.

## Acceptance Criteria

- Loading the homepage with at least one active channel shows that channel's
  code and bounded preview (lead party member's sprite and name, current
  location/route name, and game, where available) as a working link to its
  live view.
- Loading the homepage with no active channels shows an empty-state message
  and the manual code-entry form still works.
- A channel that becomes inactive (expiry or an unsupported-message reset) no
  longer appears in a subsequent list fetch.
- The list response and rendered homepage never include player names, HP or
  any other party-member stat, trainer names/portraits, battle state,
  badges, or any field beyond DEC-004's bounded preview fields and the
  channel code.
- A schema-version-1 (legacy) channel's preview shows the lead's name only,
  with no sprite (no `speciesId` in the legacy contract) and no game (no
  ROM/game field in the legacy contract); its location falls back to the
  legacy route's name field. This is a graceful degradation, not an error.
- `npm run check` passes, including coverage for the registry's
  active/expired code-filtering logic, the preview-derivation function for
  both schema versions, and the homepage's active/empty list rendering.
  Consistent with the existing `LiveChannel` Durable Object, the
  `ChannelRegistry` Durable Object's own request routing is not exercised by
  an automated test, since this repository has no Workers-runtime test
  harness; it is verified manually against `wrangler`/Vite dev.

## Affected Contexts

None.

## Decisions

[DEC-003](../../decisions/DEC-003-list-active-channels-on-homepage.md)
governs the product choice to list active channels by default; it is
superseded by
[DEC-004](../../decisions/DEC-004-show-a-bounded-run-preview-on-homepage-channel-cards.md),
which governs the bounded run preview this specification now requires.
This specification defines the resulting scope and requirements for both.

## Risks

- Discoverability without a shared code is a meaningful behavior change from
  the product's original ephemeral, share-the-code model; DEC-003 records the
  tradeoff, but real-world reaction from existing or future players is
  unvalidated.
- A registry that is not kept perfectly consistent with each channel's
  expiry could show a stale code or preview briefly after a run ends or
  changes, or omit a just-activated one; the requirements accept a
  page-load freshness bound rather than requiring push updates.
- The preview surfaces a small amount of run content to homepage visitors who
  were never given the channel's code; DEC-004 records this as a bounded
  continuation of DEC-003's tradeoff, not a new category of exposure, but it
  is unvalidated against real player expectations.

## Open Questions

None.
