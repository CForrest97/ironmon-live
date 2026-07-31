---
id: WORK-001
title: Adopt TypeScript, Markdown work items, and agent learning
status: in-progress
kind: repository
artifacts:
  - DEC-001
  - DEC-002
learnings:
  - LRN-001
---

# Adopt TypeScript, Markdown work items, and agent learning

## Intent

Align the initial repository with explicit maintainer preferences and give the
agent durable, reviewable memory for improving after mistakes.

## Outcome

Repository tooling is TypeScript-only, normal work is represented by Markdown
files, GitHub Issues are disabled, and reusable corrections feed a validated
learning loop.

## Context

The initial scaffold used `.mjs` scripts, a Go-based workflow-linting step, and
GitHub issue forms before these preferences were known. See `DEC-001`,
`DEC-002`, and `LRN-001`.

## Scope

Convert repository scripts and tests, replace issue forms with work-item
contracts, add learning records, and update agent guidance and CI. Choosing the
application architecture remains outside this work.

## Acceptance Criteria

- All repository scripts and tests use `.ts`.
- The quality workflow has no Go setup and validates workflow policy in TypeScript.
- GitHub Issues are disabled and `WORK-###` files are validated.
- Reusable agent learnings use validated `LRN-###` records.
- Agent guidance requires a prevention change for every reusable learning.

## Plan

Add accepted repository decisions, TypeScript validation, work and learning
schemas, regression tests, and remote GitHub configuration updates.

## Validation

Run `npm run check`, verify the pull-request workflow, and inspect remote
repository settings after merge.

## Agent Notes

This feedback exposed a reusable failure mode: collaborator preferences were not
captured as durable repository context. `LRN-001` records the prevention.
