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

Repository tooling is TypeScript-only, normal work is represented by Markdown
files, GitHub Issues are disabled, reusable corrections stay compact in agent
guidance, and a different read-only agent rates merge risk.

## Context

The initial scaffold used `.mjs` scripts, a Go-based workflow-linting step, and
GitHub issue forms before these preferences were known. A first revision then
made repository decisions and learnings too heavyweight.

## Scope

Convert repository scripts and tests, replace issue forms with work-item
contracts, keep learned rules in startup guidance, and add an independent review
skill and custom reviewer agent. Product decisions and application architecture
remain outside this work.

## Acceptance Criteria

- All repository scripts and tests use `.ts`.
- The quality workflow has no Go setup and validates workflow policy in TypeScript.
- GitHub Issues are disabled and `WORK-###` files are validated.
- Reusable lessons are concise and loaded through `AGENTS.md`.
- A different read-only agent rates every change before merge.
- Ratings 2–3 or uncertain reviews stop for human approval.

## Plan

Add TypeScript validation, work-item contracts, compact learned rules, a repo
review skill, a custom reviewer model, and remote GitHub configuration updates.

## Validation

`npm run check` passes with 25 Markdown files, strict TypeScript compilation,
one governed work item, two workflow files, and fourteen tests. The official
skill validator passes. Pull request 3's required `quality` check passes.

The separate `gpt-5.6-terra` reviewer reported no blocking findings with high
confidence and rated the material CI/agent-governance change `2`; human approval
is therefore required before merge.

## Agent Notes

Learned rule: keep recurring preferences as concise startup guidance; keep
incident detail here rather than creating a second documentation hierarchy.
