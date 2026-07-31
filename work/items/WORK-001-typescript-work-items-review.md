---
id: WORK-001
title: Adopt TypeScript, Markdown work items, and agent review
status: blocked
kind: repository
artifacts: []
---

# Adopt TypeScript, Markdown work items, and agent review

## Intent

Align the initial repository with explicit maintainer preferences, concise
startup learning, and independent risk review before merge.

## Outcome

Program logic uses TypeScript, while thin command orchestration may use shell.
Normal work is represented by Markdown files, GitHub Issues are disabled,
reusable corrections stay compact in agent guidance, and a different read-only
agent rates merge risk.

## Context

The initial scaffold used `.mjs` scripts, a Go-based workflow-linting step, and
GitHub issue forms before these preferences were known. A first revision then
made repository decisions and learnings too heavyweight.

## Scope

Convert programmatic repository scripts and tests, retain shell where it is a
clear command runner, replace issue forms with work-item contracts, keep learned
rules in startup guidance, add conditional TypeScript expertise, and add an
independent review skill and custom reviewer agent. Product decisions and
application architecture remain outside this work.

## Acceptance Criteria

- Program logic and tests use TypeScript; thin command orchestration may use shell.
- TypeScript changes load a concise `typescript-expert` skill with pragmatic,
  non-absolute preferences.
- Prettier and strict, type-aware ESLint run as part of repository quality.
- The quality workflow has no Go setup and validates workflow policy in TypeScript.
- GitHub Issues are disabled and `WORK-###` files are validated.
- Reusable lessons are concise and loaded through `AGENTS.md`.
- A different read-only agent rates every change before merge.
- Ratings 2–3 or uncertain reviews stop for human approval.

## Plan

Add TypeScript validation, work-item contracts, compact learned rules, a
TypeScript skill, formatting and linting, a repo review skill, a custom reviewer
model, and remote GitHub configuration updates.

## Validation

`npm ci`, `npm test`, and `npm run check` pass. Quality covers Prettier,
type-aware ESLint, strict TypeScript compilation, 26 Markdown files, one
governed work item, two workflows, and fifteen tests. `bash -n` accepts the
GitHub configuration script, and the official skill validator accepts
`typescript-expert`.

A fresh-agent forward test found no TypeScript issues and confirmed that the
skill permits justified exceptions instead of enforcing subjective style. The
work remains blocked until the exact-head independent review is posted to pull
request 3 and its required approval is resolved.

## Agent Notes

Learned rule: keep recurring preferences as concise startup guidance; keep
incident detail here rather than creating a second documentation hierarchy.
