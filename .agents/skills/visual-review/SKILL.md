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

- **Design.** Search the scene for pixel-level imperfections — anything
  misaligned, overflowing, crowded, unbalanced, or inconsistent with the rest
  of the app. Treat this as an open search, not a checklist to confirm clear:
  the point is to notice what's actually wrong on this screen, not to verify
  the absence of a fixed list of named problems.
- **Content fit.** Given what this screen is *for*, is the right information
  present, in the right place, at the right prominence — not just whether the
  boxes holding it line up.

Read `docs/product/specs/PRD-001-live-player-companion.md`'s Desired Outcomes
and numbered Requirements before starting. The primary outcome governs every
channel scene: *a player can understand detailed current-party information and
current-route trainer progress at a glance during play.* Judge content fit
against that, not against general UX taste — but treat the Requirements as the
literal, checkable definition of what "detailed" and "at a glance" mean. Where
a requirement names specific fields (for example, "shows its IVs, EVs, stats,
moves, and types"), check `renderedText` and the manifest for each named field
individually rather than for the topic in general. A requirement whose general
subject appears on screen but whose specific named fields do not is still a
miss — do not credit a requirement from a partial match.

## Measure before you judge

Vision alone produces confident guesses about pixel relationships. Take every
measurable claim from `manifest.json` and reserve the images for what only an
image answers: emphasis, balance, crowding, and whether the scene reads.

Never report a measurable defect you have not computed from the manifest.

## Design: searching for imperfections

Work through each scene at each viewport. The manifest gives you the measured
position, size, font size, and weight of every landmark, plus how much of the
fold is actually covered by content (`foldFillRatio`, `foldEmptyBelowContentPx`)
— use it as your evidence, not the screenshot's appearance. The categories
below are examples of the kind of thing that's worth finding, not a list to
run down and clear:

- Something above the fold that the scene's `intent` doesn't need, or
  something the intent needs that only appears after scrolling.
- The page's top-to-bottom order doesn't match the priority the `intent`
  implies — if the intent names things in a sequence (for example "what is
  alive, what is being fought, how far the route has gone"), check whether the
  landmarks' `y` order actually agrees. A lower-priority section placed above
  a higher-priority one is a defect even when each section looks fine on its
  own.
- A low `foldFillRatio` or a large `foldEmptyBelowContentPx` for a scene whose
  `intent` calls for taking in the state at a glance. These are measured, not
  impressions — a mostly-empty fold or a large empty band below the last
  visible element is a defect in its own right, separate from whether
  individual cards are internally well-aligned.
- The same landmark `label` (or near-identical wording) appears more than once
  for genuinely different elements — for example a summary card and a
  separately expandable section both titled the same thing — with nothing
  distinguishing what each one is or holds. That reads as a duplicate or a
  dead element to a viewer even when both are intentional.
- Edges that look aligned in the image but differ by a few pixels in `x` or
  `x + width` — and, just as much, edges that look intentionally offset but
  aren't (no indent or nesting visible to explain it).
- Gaps between siblings that break the rhythm of their neighbours, margins
  that aren't symmetric, or spacing that implies a grouping the content
  doesn't have.
- `fontSize`/`fontWeight` that don't track importance down the page — the
  thing that matters most for this scene should read as the most prominent.
- The same component looking or spacing itself differently across scenes or
  viewports with no reason visible in the content.
- Anything — text or otherwise — that breaches its container, gets clipped,
  or collides with a neighbour. `horizontalOverflow: true` is always a
  blocking finding, but overflow isn't limited to text: a row of icons,
  progress markers, or any other element bleeding past its parent's right
  edge is just as real a defect and just as measurable from the manifest.

## Content fit: does the screen serve the player

This is a distinct pass, not a restatement of the design lens — a screen can
be pixel-perfect and still fail here. Read `renderedText` on each capture
alongside the image: it's the page's actual rendered text, and content-fit
questions ("is this information present," "how much is actually shown at a
glance") are usually answered more reliably from what the page rendered as
text than from reading it off a screenshot. Use the image for what only the
image answers — prominence, grouping, whether it's easy to take in at a
glance — and the text for what's present at all.

For each landmark that carries real data (not chrome — a party member's HP, a
trainer's battled state, a route's progress, a badge list), ask what decision
or knowledge a player uses it for, then check whether the screen actually
gives them that:

- **Missing critical data.** Something the player needs to act (current HP as
  a number *and* a bar, status conditions, whether a battle is ongoing and
  against what) that is absent, buried in an unopened accordion, or only
  inferable rather than stated.
- **Prominence mismatched to importance.** A low-stakes decorative detail (a
  badge icon, a cosmetic label) sized or positioned more prominently than
  something the player needs mid-battle (HP, status, whose turn). Compare
  `fontSize`/`fontWeight` and position, but judge by what the data is *for*,
  not just its visual weight relative to neighbours.
- **Wrong grouping for the decision.** Data split across two places when a
  single decision needs both together (for example: a party member's HP
  without its status effect, or a trainer's battled state without which
  Pokémon they're known to carry, when the fixture provides both).
- **Empty or placeholder-only regions.** A card or section rendered with a
  heading but no content for this scene — that is a content-fit defect even
  when its box aligns perfectly with its siblings.
- **Thin at a glance.** Even with no single piece of data missing, ask
  whether the scene as a whole gives a viewer enough to resolve the run's
  state in one glance, per the PRD outcome above — a screen that technically
  contains the right facts but reads as sparse or requires piecing together
  several small labels is still a content-fit defect.

A finding here needs the same evidence discipline as the design lens: name
the landmark, what data it holds or lacks per the manifest, `renderedText`,
and the scene's fixture, and the specific player decision it blocks or slows.

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
