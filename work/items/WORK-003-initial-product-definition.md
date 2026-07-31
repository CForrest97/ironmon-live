---
id: WORK-003
title: Define the initial IronMON Live product
status: in-progress
kind: product
artifacts:
  - PRD-001
  - DEC-001
---

# Define the initial IronMON Live product

## Intent

Turn the maintainer's initial product direction and Tracker-extension proof of
concept into an auditable product foundation without presenting unvalidated
assumptions as accepted truth.

## Outcome

The product brief, shared language, domain narrative, discovery evidence, draft
initial specification, and proposed channel decision agree on a player-first,
ephemeral live companion and make remaining validation and product decisions
explicit.

## Context

- [Initial player-companion discovery](../../docs/product/discovery/2026-07-31-initial-player-companion.md)
- [Product brief](../../docs/product/product-brief.md)
- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
- [DEC-001](../../docs/decisions/DEC-001-unauthenticated-live-channels.md)

The repository was already on `work-002-product-manager-skill` with uncommitted
WORK-002 changes when this work began. This work does not alter or revert those
changes; it should be separated onto a focused branch before pull-request
review.

## Scope

Record the interview and PoC observations, define the durable product
direction, draft the first player-companion specification, propose the
ephemeral channel decision, and reconcile relevant glossary, narrative, map,
and indexes. Do not create bounded contexts without evidence or implement
application behavior.

## Acceptance Criteria

- Maintainer statements and PoC observations are preserved separately from
  interpretation.
- The product brief identifies the initial problem, users, proposition,
  outcomes, non-goals, and remaining questions.
- The draft PRD traces its requirements to discovery and keeps unsupported
  compatibility, lifecycle, security, and validation matters open.
- The proposed channel decision records the explicitly accepted convenience and
  security trade-off without describing the channel as private or secure.
- Product and domain terms, narrative, context map, indexes, and references
  agree.
- Repository checks pass.

## Plan

Create the governed product artifacts, validate repository contracts, review
the resulting documentation for coherence, and prepare it for independent
change review on a focused branch.

## Validation

`npm run check` passes Markdown linting, formatting, type-aware ESLint, strict
TypeScript compilation, documentation and workflow validation, and all fifteen
tests. Documentation validation reports five governed artifacts.

A coherence review confirmed that the brief, discovery note, PRD, proposed
decision, glossary, narrative, and context map agree on the player-first scope,
upstream Tracker constraint, ephemeral run state, stable channel, and accepted
security trade-off. Compatibility, lifecycle edge states, collision behavior,
and direct player validation remain explicit open questions.

## Agent Notes

Assumption: the maintainer's request to create the documents authorizes draft
product artifacts and a proposed decision, but not acceptance of either while
material open questions and unvalidated user hypotheses remain.
