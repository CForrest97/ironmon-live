---
id: WORK-018
title: Add a scripted visual review harness
status: in-progress
kind: repository
artifacts:
  - PRD-001
---

# Add a scripted visual review harness

## Intent

Layout quality on the channel and entry surfaces is currently only checked by
eye. Make it possible to ask for a consistent, evidence-backed review of how
the rendered pages read, without a person having to open each one.

## Outcome

An operator runs one command and gets a rated review of every governed screen
at every reviewed viewport, with findings tied to measured geometry.

## Context

- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md) requires
  a viewer to resolve a run's state at a glance.
- [WORK-010](WORK-010-implement-expanded-player-first-live-channel.md)
  established the expanded channel layout under review.
- The existing `apps/web/test/viewport.spec.ts` already proved that a fixture
  `WebSocket` is what makes these screens deterministic.

## Scope

Add scene fixtures shared with the viewport specs, a Playwright capture that
records screenshots and landmark geometry, a rubric skill and reviewer agent,
and a driver that hands the capture to Claude Code. Do not gate `npm run check`
on the review, change any application behavior, or add a runtime dependency.

## Acceptance Criteria

- `npm run review:visual` captures every scene and prints a rated review.
- The capture starts the preview server itself, or reuses a running one.
- Screenshots are deterministic: pinned randomness, no third-party artwork, and
  no staleness banner appearing mid-capture.
- Every capture records landmark geometry so measurable findings are computed
  rather than estimated.
- The viewport specs and the capture describe each scene exactly once.
- Repository checks pass.

## Plan

Extract the spec's fixtures into `apps/web/visual/scenes.ts`, capture bands and
geometry in `apps/web/visual/capture.ts`, hold the rubric in
`.agents/skills/visual-review/SKILL.md`, and drive `claude -p` from
`apps/web/visual/review.ts`.

## Validation

- `npm run review:visual` captured 12 views and returned a rated review.
- The first run reported a real defect: home-page channel cards occupy 288px of
  their 576px column while every sibling spans the full width. Confirmed
  against the captured screenshot.
- `npm run check` passed.

## Agent Notes

Images alone invite confident guesses about pixel relationships, so the capture
records measured landmark geometry and the rubric requires measurable findings
to be computed from it. Bands are capped at three; below-fold review is about
the first scroll, not the whole page.

Sprite artwork is blocked during capture. The boxes are CSS-sized, so layout is
unaffected, and blocking keeps runs offline-safe and identical.
