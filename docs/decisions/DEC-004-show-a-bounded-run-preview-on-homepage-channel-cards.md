---
id: DEC-004
title: Show a bounded run preview on homepage channel cards
status: accepted
category: product
supersedes: [DEC-003]
---

# Show a bounded run preview on homepage channel cards

## Context

[DEC-003](DEC-003-list-active-channels-on-homepage.md) let the homepage list
every active channel by default, but bounded each listed entry to the bare
five-digit code: "no player name, run content, party, route, or other
snapshot-derived detail." Its own "Alternatives" section explicitly
considered a richer listing (a run summary) and rejected it as a larger
increment than that decision called for, while noting it "remains available
as a future increment if evidenced."

The maintainer has now directly requested that increment: a homepage visitor
should see a small run glimpse per channel, not just its code, so browsing
the list is more useful before opening a channel. The maintainer specified
the fields directly, in priority order: one focused party member's sprite and
name, the current route, and the game. Health was considered and explicitly
cut after review — a numeric HP readout was judged unreadable at homepage-card
scale and low priority relative to the other fields.

This does not reopen [DEC-001](DEC-001-unauthenticated-live-channels.md)'s
premise. DEC-001 already established that anyone holding a channel's code can
view its full run state (party, route, battle, and progress detail) without
authentication; a person with the code is already shown far more than what
this decision adds to the homepage. The only boundary DEC-003 and this
decision negotiate is what a visitor sees "before" holding a code, on the
homepage itself.

## Decision

Each homepage channel card additionally shows a bounded run preview, computed
from the channel's current snapshot:

- The first party member ("the lead"): its species, for a sprite icon, and
  its name.
- The current location/route name (e.g. "Route 3").
- The game (ROM name, e.g. "Pokemon FireRed").

The preview excludes player name, HP or any other party-member stat, trainer
names or portraits, battle state, badges, and every other snapshot field.
[PRD-004](../product/specs/PRD-004-list-active-channels-on-homepage.md)'s
acceptance criteria are updated in the same change to name exactly this
bounded field set in place of the code-only constraint.

The preview is derived through a single shared function
(`derivePreview` in `packages/contracts`) so the bound is enforced at the
type/derivation layer the registry and homepage both depend on, not
re-implemented ad hoc at each call site.

## Consequences

- Homepage visitors get a genuinely useful glimpse — who's leading, where the
  run is, which game — without opening the channel, which was DEC-003's
  explicitly deferred alternative.
- The registry (`ChannelRegistry`) now stores a small derived preview
  alongside each code, refreshed on the same throttle as code registration
  (at most once per 60 seconds per channel); it still stores no full
  snapshot.
- A schema-version-1 (legacy) publisher's preview shows a name only, with no
  sprite (the legacy contract carries no `speciesId`) and no game (the legacy
  contract carries no ROM/game field); location falls back to the legacy
  route's name field, since legacy has no separate location. This is a
  graceful degradation, not an error.
- The gap between "given a code" and "homepage visitor" narrows further: a
  homepage visitor now sees a small amount of live run content, not just a
  code, without ever having been given that code. This is a continuation of
  the tradeoff DEC-003 already recorded, not a new category of exposure,
  since code holders already see the full snapshot today.
- A player who wants their run's content invisible to homepage visitors has
  no opt-out; that remains DEC-003's unresolved tradeoff, not addressed here.

## Alternatives

- **Keep the code-only listing (status quo)**: rejected because it does not
  satisfy the maintainer's direct request for a richer preview.
- **Show the full party and an aggregate trainer-progress count**: an earlier
  draft of this decision considered every party member's sprite and HP plus
  a "3/8 trainers" count. Rejected after maintainer review: the maintainer's
  actual priority was a single focused lead, the route, and the game, not
  the whole party; a numeric HP readout was separately rejected as
  unreadable at card scale.
- **Show the full overview (battle state, badges)**: rejected as more than
  "minimal" — it would make the homepage a second copy of the channel view
  rather than a glance that invites opening it.
- **Per-player opt-in/opt-out for the preview specifically**: rejected for
  the same reason DEC-003 rejected it for listing itself — it is a larger
  increment (companion/contract changes to carry a preference) than what was
  requested here.

## Supersedes

[DEC-003](DEC-003-list-active-channels-on-homepage.md): its restriction to a
code-only listing no longer holds; DEC-003's decision to list every active
channel by default, with no per-player opt-out, is unchanged and remains in
force under this record.

## Open Questions

None.
