---
id: WORK-015
title: Add an empty-party starter-ball prompt
status: in-progress
kind: product
artifacts:
  - PRD-003
  - DEC-005
---

# Add an empty-party starter-ball prompt

## Intent

Give a player a small, playful first-pick moment at the start of an active run
without presenting
strategy, inferred game knowledge, or a claim about unreported ball contents.

## Outcome

An empty-party live channel shows a classic pixel-style scene with three
CSS-rendered balls only while Tracker reports `active`. One ball is randomly
and stably marked "Recommended pick" for that display episode. The prompt is
absent in every other run state and after the party gains a member.

## Context

[PRD-003](../../docs/product/specs/PRD-003-expand-player-first-live-channel.md)
otherwise excludes advice, encounter recommendations, and inferred gameplay
facts. [DEC-005](../../docs/decisions/DEC-005-show-a-random-startup-ball-prompt.md)
records the maintainer-requested narrow exception: the recommendation is
random presentation, not evidence-based guidance.

## Scope

Add a reusable web component below the run header in both legacy and expanded
channel views. Its CSS artwork and animation use existing design tokens and no
external image assets. It has no click behaviour, reroll, persistent state,
Tracker write, contract, Worker, or live-delivery change.

## Acceptance Criteria

- Exactly three accessible Left, Centre, and Right ball cards appear only for
  an empty-party `active` snapshot in both supported schema views.
- Exactly one card is randomly selected on mount and remains selected through
  rerenders of the same empty-party active-run episode.
- The selected card has a recommendation badge, stepped bounce, glow,
  sparkles, and selection arrow; unselected cards are dimmer and static.
- Reduced-motion preferences retain the badge and disable the animated
  movement and effects.
- At 640 CSS pixels the scene remains three columns with no horizontal
  scrolling; narrower displays collapse safely.
- `npm run check` and the required product-fit, domain-consistency, and
  independent merge-risk reviews pass before merge.

## Plan

Render the conditionally mounted prompt directly from `LegacyRunView` and
`ExpandedRunView`, using component-local random state so the recommendation is
stable only for the current display episode. Cover its state conditions and
selection classes with component tests, its reduced-motion CSS with a focused
style test, and the 640-pixel layout with the existing browser fixture.

## Validation

- `npm test` passes, including all companion, web, contracts, root validator,
  and 640-pixel Playwright tests.
- `npm run check:types`, `npm run lint:ts`, `npm run lint:markdown`,
  `npm run format:check`, and `npm run validate:workflows` pass.
- `npm run validate:docs` and `npm run check` reach only the pre-existing
  untracked `WORK-014` omission from `work/items/README.md`; this item leaves
  that unrelated work untouched. An isolated repository copy excluding that
  file validates this item's governed documents successfully.
- Product-fit, domain-consistency, and independent merge-risk reviews are in
  progress before merge.

## Agent Notes

The maintainer confirmed that the balls should be CSS-built sprite-like art,
not image assets. This preserves crisp pixel scaling and avoids an external
asset dependency. The Tracker's actual start-of-run snapshot has
`status: "active"` with an empty party, so this item corrects its initial
`startup` assumption to that observed condition.
