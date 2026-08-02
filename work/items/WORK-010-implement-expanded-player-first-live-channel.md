---
id: WORK-010
title: Implement the expanded player-first live channel
status: in-progress
kind: product
artifacts:
  - PRD-003
  - DEC-002
---

# Implement the expanded player-first live channel

## Intent

Deliver PRD-003's progressive-disclosure player channel while the bundled
Tracker extension remains limited to schema version 1.

## Outcome

The companion publishes deterministic schema-version-2 expanded state for
version 1 input, and the website presents a compact live overview with Party,
Battle, Route, and Progress detail panels.

## Context

- [PRD-003](../../docs/product/specs/PRD-003-expand-player-first-live-channel.md)
- [DEC-002](../../docs/decisions/DEC-002-temporary-companion-expanded-demo-state.md)
- [Tracker extension capability inventory](../../apps/tracker-extension/capability.md)

## Scope

Add strict version 2 contracts, the temporary companion bridge, the player
dashboard, sprite fallbacks, responsive automated coverage, and focused tests.
Keep the Lua extension on version 1; do not add randomizer data, bag data,
encounter history, accounts, or retained run history.

## Acceptance Criteria

- Direct version 1 messages and channel rendering remain valid.
- Version 1 companion input is normalized deterministically to version 2;
  native version 2 snapshots remain unchanged.
- The overview and all named detail panels work at 640 CSS pixels without
  horizontal scrolling.
- Failed imagery preserves readable state information.
- `npm run check` passes.

## Plan

Implement the versioned contract and bridge before replacing the web view, then
validate strict parsing, availability semantics, responsive layout, and image
fallback behavior.

## Validation

`npm run check` passes Markdown and TypeScript checks, governed-document and
workflow validation, 31 repository tests, 17 companion tests, 10 web component
tests, 5 contract tests, and the Chromium 640-CSS-pixel viewport test.

## Agent Notes

The required scenario sessions with active IronMON players remain outstanding.
Record findings before treating the information hierarchy as player-validated.

### 2026-08-02: maintainer scenario feedback and layout revision

The maintainer, using the channel page as a player, reported the delivered
dashboard had too much scrolling, buried run-status information (badges,
route progress) inside collapsed panels, and always-expanded verbose party
stats. This is the outstanding scenario feedback this item's validation
already called for. Findings and the resulting change:

- The Party, Route-progress, Battle, and Badges state a player needs at a
  glance was only visible after opening a collapsed panel; badges and route
  trainer progress in particular were buried in the last "Progress" panel.
- Full IV/EV/stat-stage/nature/experience/friendship/shiny/pokerus detail was
  always rendered per party member even though most runs carry 1-2 members,
  adding scroll height with low glance value per requirement 3's compactness
  goal.
- Opening more than one panel at once (native independent `<details>`)
  compounded scroll length.

Revised `apps/web/src/App.tsx` and `apps/web/src/styles.css` accordingly: the
overview now shows per-member sprite and HP, route-trainer progress track,
and a badge chip row without opening a panel; party cards keep identity,
health, level, ability, held item, and moves visible by default and move
nature/experience/friendship/gender/shiny/pokerus/stats/stat-stages/IVs/EVs
into a nested "More details" disclosure (all fields remain available per
requirement 4, none removed); the four detail panels became a single-open
accordion instead of independently toggled `<details>`; badges render as
colored chips instead of a plain comma list.

Trainer portraits: added a `TrainerPortrait` component using the existing
`portraitId` contract field with the same graceful text-fallback pattern as
the Pokémon `Sprite` component, per requirement 8. No new external image
source was selected or validated — `portraitId` is always unavailable from
today's companion bridge (`apps/companion/src/expanded-state.ts`), so this
renders the fallback chip until a source is chosen; badge iconography was
deferred for the same reason (chips remain colored text, not icons). This
keeps PRD-003's open question about the image-source selection genuinely
open rather than quietly resolving it.

`apps/web/test/viewport.spec.ts` was updated for the accordion's button-based
panel toggles (previously `<summary>` elements). Web component test count
rose from 6 to 10 to cover the accordion's single-open behavior, the party
"more details" disclosure, the trainer-portrait fallback, and (after
independent review below) badges remaining visible in the Progress panel.

An independent review (per `AGENTS.md`'s review gate, using this repo's
`review-change` skill methodology since no `risk_reviewer` agent type was
available in the executing session) rated this change 2/3 and flagged two
issues, both fixed before merge:

- Badges had been dropped entirely from the Progress panel, contradicting
  PRD-003 requirement 7's literal text ("the Progress panel shall show ...
  badges"). Fixed by keeping a `BadgeChips` row in the Progress panel in
  addition to the new overview badge card, and added a regression test.
- The accordion toggle buttons (`.panel-summary`) used `all: unset` with no
  replacement focus style, silently dropping the native `<summary>` focus
  ring for keyboard users. Fixed with an explicit `:focus-visible` outline,
  plus `aria-controls`/`id` linking each toggle to its panel content.

Human approval is required per the review gate (rating 2) before merging.
