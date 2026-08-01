---
id: WORK-007
title: Define the quiet companion utility
status: done
kind: product
artifacts:
  - PRD-002
  - DEC-001
---

# Define the quiet companion utility

## Intent

Turn the maintainer's macOS-first companion direction into a focused,
evidence-aware product specification without prematurely selecting technology
or turning the companion into a second run-viewing product.

## Outcome

A draft PRD defines the smallest useful menu-bar utility, the responsibility
boundaries between Lua, companion, and website, observable setup and recovery
behavior, prioritized requirements, distribution direction, risks, and the
decisions still required before implementation.

## Context

- [Companion utility product direction](../../docs/product/discovery/2026-08-01-companion-utility-direction.md)
- [Product brief](../../docs/product/product-brief.md)
- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
- [PRD-002](../../docs/product/specs/PRD-002-companion-utility.md)
- [DEC-001](../../docs/decisions/DEC-001-unauthenticated-live-channels.md)

## Scope

Define product outcomes, users, flows, requirements, failure behavior, UX
principles, assumptions, risks, open questions, distribution expectations, and
explicit exclusions for a macOS-first companion utility. Preserve the current
accountless channel policy as unresolved where it conflicts with the new
authentication direction.

Do not select an application framework, programming language, internal
architecture, schema, or API. Do not implement application behavior or accept
any draft artifact.

## Acceptance Criteria

- The PRD contains all seventeen requested sections.
- Every functional and non-functional requirement includes priority, user
  value, and rationale.
- The specification challenges emulator-process detection, duplicated desktop
  viewing, over-broad automation, and undefined authentication.
- Lifecycle, offline recovery, hybrid publication cadence, and low-friction
  onboarding have observable behavior.
- The Lua extension, companion, and website have distinct product
  responsibilities.
- The Cloudflare-hosted object bucket is recorded as a distribution constraint
  together with unresolved integrity and release-governance needs.
- Product and work-item indexes reference the new governed artifacts.
- Repository checks pass.

## Plan

Capture the maintainer direction as discovery evidence, draft PRD-002 against
the existing product truth, reconcile indexes, validate documentation, and
prepare the focused branch for independent review.

## Validation

`npm run check` passes Markdown linting, formatting, strict ESLint and
TypeScript checks, governed-document and workflow validation, all nineteen
repository tests, three companion tests, one web test, and three contract
tests. Documentation validation reports nine governed artifacts.

The PRD was checked against PRD-001, DEC-001, the product brief, principles,
glossary, narrative, and context map. Publisher authentication, named supported
versions, distribution governance, update behavior, and direct player evidence
remain explicit open questions rather than inferred requirements.

## Agent Notes

Assumption: the request to produce a PRD authorizes draft product and work-item
artifacts, but not acceptance of unresolved authentication, compatibility,
distribution, or user-validation decisions.
