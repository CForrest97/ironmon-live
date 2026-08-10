---
id: WORK-019
title: Fix reviewed web layout hierarchy
status: in-progress
kind: product
artifacts:
  - PRD-001
  - PRD-003
---

# Fix reviewed web layout hierarchy

## Intent

Address the measured layout and hierarchy defects reported by the scripted
visual review across the homepage, expanded channel, download, and setup
surfaces.

## Outcome

Primary actions and at-a-glance run state retain clear visual priority at both
reviewed viewports, with explicit empty states and consistent page gutters.

## Context

- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
  requires the player to understand current party and route-trainer progress
  at a glance.
- [PRD-003](../../docs/product/specs/PRD-003-expand-player-first-live-channel.md)
  requires a compact overview with focused detail panels at 640 CSS pixels.
- WORK-018's measured visual review identified the affected geometry and
  hierarchy defects.

## Scope

Adjust the existing web layout, panel order, empty-state copy, responsive
spacing, and compact overview presentation only. Do not change
Tracker-observable facts or live-channel behaviour.

## Acceptance Criteria

- The homepage active-channel cards can use two columns within the entry area.
- The Party overview precedes Current focus, which replaces the separate
  Current location and Battle overview cards and itself precedes Badges; the
  Current focus switches only between Route and active Battle state; the active
  Battle state retains compact current-location and route-trainer progress
  context; the detail stack presents Party, conditional Battle, Route, then
  Progress with distinct disclosure names and visible controls.
- An empty overview party states that no party is available yet.
- Download choices precede the setup callout, their actions align, and the
  setup callout action is visually secondary.
- Narrow page gutters and setup-note insets agree across the affected routes.
- The compact party overview shows each member's reported types, move names,
  ability, nature, randomized base-stat spread, and base stat total without
  requiring a panel to be opened.
- The compact party sprite fills the height of its readiness summary without
  crowding or displacing the reported information at either reviewed viewport,
  and the readiness summary uses the remaining row width.
- Reported Pokémon condition wording remains unchanged and uses the same font,
  border, radius, and compact container rules as type tags, with a
  condition-specific colour treatment in party and battle summaries.
- Current focus uses the standard overview-card treatment in both Route and
  Battle state, so party readiness remains the primary non-battle overview
  state.
- The overview and detail-stack section gaps use the shared 8px rhythm.
- The empty-party ball uses neutral highlight language that does not imply a
  gameplay recommendation.
- The homepage entry content is anchored near the top of the viewport.
- `npm run check` and the visual capture pass.

## Plan

Adjust only the affected layout rules and page ordering, add focused component
regressions for the new empty state and download sequence, then verify with
the standard check and targeted geometry capture.

## Validation

- `npm run check` passed, including 35 web component tests and both responsive
  Playwright viewport tests.
- `npm run capture:visual --workspace=@ironmon-live/web -- --viewport=all`
  captured 14 desktop and narrow views with no horizontal overflow; the active
  battle captures retain Route context and reported trainer progress.
- The capture verifies full-width two-column homepage cards, natural
  overview-card heights on desktop, Party before Current focus before Badges,
  explicit detail controls, and consistent 8px narrow gutters.
- The Party overview geometry test keeps identity and type on one line,
  ability and moves on one line, and the base-stat strip beside the sprite at
  640 CSS pixels.

## Agent Notes

### 2026-08-10: maintainer in-play hierarchy feedback

The maintainer reported that Party followed Location despite being the more
frequent pre-battle reference; the similarly named overview and disclosure
sections did not make deeper detail discoverable; a full-width party HP bar
and sparse card stack used too much vertical space; and switching between
party, battle, and route context required repeated accordion opening and
scrolling. The revised layout puts Party before Current location, keeps the
requested Party → Route → Progress relative order, gives conditional Battle
its own detailed control after Party, and uses a Current focus preview rather
than inferring any new Tracker fact. Current focus derives only from reported
active-battle state: it shows Battle while active and Route otherwise. Party
updates and detail-panel choices do not replace it.

The maintainer then identified Current focus as the stronger summary and asked
to remove the duplicate Current location and Battle overview cards. Current
focus now sits directly after Party and before the lower-priority Badges row;
it continues to carry the reported route/location outside battle and the
reported battle summary during battle. The battle state also retains a compact
route-context line so the governing at-a-glance location and route-trainer
progress remain visible.

The maintainer also identified unused space around the compact party sprite
and asked for the artwork to better fill the overview. The sprite box now
matches the height of the adjacent readiness summary at the reviewed desktop
and split-screen widths, while the readiness summary stretches across the
remaining row width. Nature names and their raised and lowered stat modifiers
use explicit internal spacing rather than depending on collapsed text
whitespace.

The visual review then found that a neutral Route focus used an accent
treatment and that Badges had a larger gap before the detail stack than the
surrounding overview sections. Current focus now uses the standard overview
treatment in either state, and the full stack uses the shared 8px gap.

In-play feedback identified raw Pokémon condition text such as `PSN` as
visually flat. Condition wording remains exactly as reported, while known
conditions now use game-like coloured badges and unknown values retain a
neutral badge. Status and type badges share one base visual treatment so their
font and container sizing remain equal within the same party summary.

The reported ability now sits with the compact party identity and readiness
facts, between type and moves, so it remains visible without opening Party
details.

The maintainer then reported that placing every Party overview fact on a new
line created excessive vertical whitespace. Identity, nature, and types now
share one wrapping line; ability and moves share another; and the randomized
base-stat strip sits in the readiness column beside the sprite instead of
creating a full-width row beneath it. The facts and their wording are unchanged.
