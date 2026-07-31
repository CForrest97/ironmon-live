---
id: LRN-001
title: Capture collaborator preferences as durable context
status: active
trigger: correction
work_items:
  - WORK-001
---

# Capture collaborator preferences as durable context

## Observation

The initial repository selected JavaScript modules, a Go-based workflow check,
and GitHub Issues before the maintainer's TypeScript and Markdown-workflow
preferences were recorded.

## Root Cause

The repository had strong product and domain templates but no explicit place or
agent step for durable collaborator workflow preferences. Reasonable defaults
therefore became conventions too early.

## Correction

The preferences are captured in `DEC-001` and `DEC-002`; tooling is migrated to
TypeScript and work management moves into the repository.

## Prevention

`AGENTS.md` now requires agents to read accepted repository decisions before
working and to turn reusable corrections into learning plus a prevention
mechanism. The validator enforces TypeScript filenames, work-item contracts, and
learning-record contracts.

## Evidence

`WORK-001` records the feedback, migration, acceptance criteria, and validation.

## Follow-up

None.
