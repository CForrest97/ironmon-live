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
- Overview cards retain their content height, and Route and Progress panels
  precede the duplicate Party and Battle panels.
- An empty overview party states that no party is available yet.
- Download choices precede the setup callout, their actions align, and the
  setup callout action is visually secondary.
- Narrow page gutters and setup-note insets agree across the affected routes.
- The compact party overview shows each member's reported types and move names
  without requiring a panel to be opened.
- The empty-party ball uses neutral highlight language that does not imply a
  gameplay recommendation.
- The homepage entry content is anchored near the top of the viewport.
- `npm run check` and the visual capture pass.

## Plan

Adjust only the affected layout rules and page ordering, add focused component
regressions for the new empty state and download sequence, then verify with
the standard check and targeted geometry capture.

## Validation

- Web component and responsive viewport tests pass.
- A targeted 10-view capture verifies no horizontal overflow, full-width
  two-column homepage cards, natural overview-card heights on desktop, Route
  and Progress before duplicate detail panels, and consistent 8px narrow
  gutters. The narrow overview retains two columns so Badges is no longer
  sliced at the fold, and its detail stack begins just below the fold.

## Agent Notes

The review measures visual panel ordering rather than DOM order. The existing
panel source order remains stable for the accordion's state and tests, while
CSS presents Route and Progress before the duplicated Party and Battle panels.
