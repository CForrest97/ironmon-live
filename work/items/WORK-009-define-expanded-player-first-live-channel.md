---
id: WORK-009
title: Define the expanded player-first live channel
status: done
kind: product
artifacts:
  - PRD-003
---

# Define the expanded player-first live channel

## Intent

Turn the maintainer's channel-page direction into a focused, evidence-aware
follow-on specification without rewriting the completed MVP baseline or
mistaking Tracker capability for validated user value.

## Outcome

A draft PRD defines a player-first, progressive-disclosure channel dashboard;
its spoiler-safe data boundary, split-screen constraint, visual fallback
behavior, schema-version expectation, and required usability validation are
clear to future delivery work.

## Context

- [Channel-page expansion direction](../../docs/product/discovery/2026-08-01-channel-page-expansion-direction.md)
- [Product brief](../../docs/product/product-brief.md)
- [Product principles](../../docs/product/principles.md)
- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
- [PRD-003](../../docs/product/specs/PRD-003-expand-player-first-live-channel.md)
- [DEC-001](../../docs/decisions/DEC-001-unauthenticated-live-channels.md)
- [Tracker extension capability inventory](../../apps/tracker-extension/capability.md)

## Scope

Capture the requested live overview, Party, Battle, Route, and Progress panels
and the contract expansion needed to supply them. Preserve the current
accountless and ephemeral channel policy, defer bag and encounter data, and
exclude spoiler-sensitive randomizer-log data.

Do not implement the page, schema, Lua export, transport, imagery, or a new
spectator experience. Do not select an image provider or claim support for a
specific Tracker or game configuration.

## Acceptance Criteria

- PRD-003 is a draft follow-on to PRD-001 and preserves the MVP's historical
  scope.
- The PRD specifies the compact overview, progressive disclosure, included
  data groups, exclusions, image fallbacks, and 640 CSS-pixel split-screen
  constraint.
- The versioned expanded-contract requirement preserves version 1 behavior and
  explicit availability semantics.
- The discovery note distinguishes maintainer direction and capability evidence
  from player validation.
- Product-specification, discovery, and work-item indexes link the new
  governed artifacts.
- Repository checks pass.

## Plan

Record the maintainer direction as discovery evidence, draft the follow-on PRD
against PRD-001 and DEC-001, update documentation indexes, and validate the
governed documentation without changing the current implementation.

## Validation

`git diff --check` reports no whitespace errors. `npm run check` passes
Markdown linting, formatting, strict ESLint and TypeScript checks, governed
documentation and workflow validation, 31 repository tests, 14 companion
tests, 3 web tests, and 3 contract tests.

Documentation validation reports 12 governed artifacts.

## Agent Notes

Assumption: the requested expanded channel is a post-MVP product increment;
PRD-001 continues to describe the MVP baseline. The asset provider, validated
Tracker compatibility, and player-study threshold remain open rather than
invented.
