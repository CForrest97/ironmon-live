---
name: visual-review
description: Review captured IronMON Live screenshots for layout quality — fold priority, whitespace, alignment, hierarchy, grouping, and consistency — using the measured geometry manifest rather than impressions. Use when reviewing rendered pages; do not use for code review or implementation.
---

# Visual review

Review the captured screens read-only. Do not edit files or change the app.

Each capture is a scene at one viewport, split into bands. Band 1 is exactly
what a viewer sees before scrolling; later bands are the first scrolls. The
manifest records every landmark's measured position and size in CSS pixels.

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

Judge against the scene's stated intent, not a generic idea of good design.
IronMON Live is watched while something else is happening, so a viewer should
resolve the run's state in one glance.

Sprite artwork is blocked during capture, so sprite boxes are empty at their
real size. Never report that as a finding.

## Reporting

Report findings ordered by severity. Give each one:

- The scene, viewport, and band.
- The measurement or the visible evidence, with the landmark labels involved.
- Its cost to the viewer, in terms of the scene's intent.
- One concrete change.

Name the scenes that are sound in one closing line. Do not pad the list to look
thorough, and do not restate the rubric as a finding.

Choose exactly one rating:

- `0` — no finding worth acting on.
- `1` — minor polish only; nothing obstructs the scene's intent.
- `2` — the scene's intent is measurably harder to serve: needed information
  below the fold, broken alignment, or unbalanced whitespace.
- `3` — the scene fails at this viewport: overflow, clipping, unreadable
  hierarchy, or an unusable layout.

Return exactly this compact footer after the findings:

```text
VISUAL_RATING: <0|1|2|3>
VISUAL_CONFIDENCE: <high|medium|low>
SCENES_REVIEWED: <count>
BLOCKING_FINDINGS: <count>
VISUAL_SUMMARY: <one sentence>
```
