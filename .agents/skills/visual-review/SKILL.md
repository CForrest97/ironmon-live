---
name: visual-review
description: Review captured IronMON Live screenshots for layout quality — fold priority, whitespace, alignment, hierarchy, grouping, consistency — and for content fit against player needs, using the measured geometry manifest rather than impressions. Use when reviewing rendered pages; do not use for code review or implementation.
---

# Visual review

Review the captured screens read-only. Do not edit files or change the app.

Each capture is a scene at one viewport, split into bands. Band 1 is exactly
what a viewer sees before scrolling; later bands are the first scrolls. The
manifest records every landmark's measured position and size in CSS pixels.

This review has two lenses, and both are required. A screen can pass the first
and still fail the second: it can be beautifully balanced and still show the
wrong things, or hide the right thing behind a generic label. Do not let a
clean design lens finding stand in for a content check that was skipped.

- **Design** (checks 1-7): does the layout read well — fold, alignment,
  whitespace, hierarchy, consistency.
- **Content fit** (check 8): given what this screen is *for*, is the right
  information present, in the right place, at the right prominence — not just
  whether the boxes holding it line up.

Read `docs/product/specs/PRD-001-live-player-companion.md`'s Desired Outcomes
before starting. The primary one governs every channel scene: *a player can
understand detailed current-party information and current-route trainer
progress at a glance during play.* Judge check 8 against that, not against
general UX taste.

## Measure before you judge

Vision alone produces confident guesses about pixel relationships. Take every
measurable claim from `manifest.json` and reserve the images for what only an
image answers: emphasis, balance, crowding, and whether the scene reads.

Never report a measurable defect you have not computed from the manifest.

## What to check

Work through each scene at each viewport.

1. **Fold priority.** Compare the scene's `intent` against the landmarks with
   `fullyAboveFold: true`. Name anything the intent needs that fell below the
   fold, and anything above the fold that the intent does not need. Judge the
   cost in screens: a landmark at `y` 1400 on a 900px viewport is a scroll and
   a half away.
2. **Alignment.** Group sibling landmarks by `x` and by `x + width`. Edges
   within 1px are aligned; edges 2-8px apart are almost certainly a mistake
   rather than a choice, and are worth reporting. Larger offsets are only a
   finding when the image shows no deliberate indent or nesting.
3. **Whitespace balance.** Compute vertical gaps between consecutive siblings
   (`next.y - (previous.y + previous.height)`). Report gaps that do not fall on
   a small set of repeated values, sections whose internal rhythm contradicts
   their neighbours, and any single gap more than twice the median for its
   region. Check left and right page margins for symmetry.
4. **Grouping.** Related landmarks should sit closer to each other than to
   unrelated ones. Report any place where spacing implies a grouping the
   content does not have.
5. **Hierarchy.** Compare `fontSize` and `fontWeight` down the page order. The
   most important thing for the scene's intent should be the most prominent.
   Report inversions and any two levels that are too close to distinguish.
6. **Consistency.** Compare the same scene across viewports and comparable
   scenes against each other. Report components that change spacing, alignment,
   or emphasis without a reason visible in the content.
7. **Overflow.** `horizontalOverflow: true` is always a blocking finding.
   Report clipped or truncated text visible in the images.
8. **Content fit.** This is a distinct pass, not a restatement of check 1. For
   each landmark that carries real data (not chrome — a party member's HP, a
   trainer's battled state, a route's progress, a badge list), ask what
   decision or knowledge a player uses it for, then check whether the screen
   actually gives them that. Concretely:
   - **Missing critical data.** Something the player needs to act (current HP
     as a number *and* a bar, status conditions, whether a battle is ongoing
     and against what) that is absent, buried in an unopened accordion, or
     only inferable rather than stated.
   - **Prominence mismatched to importance.** A low-stakes decorative detail
     (a badge icon, a cosmetic label) sized or positioned more prominently
     than something the player needs mid-battle (HP, status, whose turn).
     Compare `fontSize`/`fontWeight` and position, but judge by what the data
     is *for*, not just its visual weight relative to neighbours.
   - **Wrong grouping for the decision.** Data split across two places when a
     single decision needs both together (for example: a party member's HP
     without its status effect, or a trainer's battled state without which
     Pokémon they're known to carry, when the fixture provides both).
   - **Empty or placeholder-only regions.** A card or section rendered with a
     heading but no content for this scene — that is a content-fit defect
     even when its box aligns perfectly with its siblings.
   A finding here needs the same evidence discipline as checks 1-7: name the
   landmark, what data it holds or lacks per the manifest and the scene's
   fixture, and the specific player decision it blocks or slows.

Judge against the scene's stated intent, not a generic idea of good design.
IronMON Live is watched while something else is happening, so a viewer should
resolve the run's state in one glance.

Sprite artwork loads from real third-party CDNs during capture, so it can be
slow, missing, or briefly a broken-image icon like a real viewer would see.
Treat a sprite that failed to load as a normal content-fit or design finding —
don't wave it away, but don't assume it reveals a code bug either; it may just
be that species/portrait ID not existing on the CDN.

## Reporting

Report findings ordered by severity. Give each one:

- Its lens: `[design]` or `[content-fit]`.
- The scene, viewport, and band.
- The measurement or the visible evidence, with the landmark labels involved.
- Its cost to the viewer, in terms of the scene's intent.
- One concrete change.

Name the scenes that are sound in one closing line. Do not pad the list to look
thorough, and do not restate the rubric as a finding.

Choose exactly one rating for each lens:

- `0` — no finding worth acting on.
- `1` — minor polish only; nothing obstructs the scene's intent.
- `2` — the scene's intent is measurably harder to serve: needed information
  below the fold or missing entirely, broken alignment, or unbalanced
  whitespace.
- `3` — the scene fails at this viewport or for this player need: overflow,
  clipping, unreadable hierarchy, an unusable layout, or a decision the player
  cannot make from what the screen shows.

Return exactly this compact footer after the findings:

```text
VISUAL_RATING: <0|1|2|3>
CONTENT_FIT_RATING: <0|1|2|3>
VISUAL_CONFIDENCE: <high|medium|low>
SCENES_REVIEWED: <count>
BLOCKING_FINDINGS: <count>
VISUAL_SUMMARY: <one sentence>
```
