---
id: DEC-001
title: Prefer TypeScript
status: accepted
category: technical
supersedes: []
---

# Prefer TypeScript

## Context

The maintainer prefers one typed language across repository tooling and future
application code wherever the target platform makes that practical. The first
repository scaffold used JavaScript modules and introduced Go solely to run a
workflow linter.

## Decision

Use TypeScript by default for repository scripts, tests, and future application
code. Use another language only when TypeScript is not viable for the target or
when an accepted decision documents a material advantage.

## Consequences

Repository scripts are type-checked and executed with a TypeScript runner. The
quality workflow uses the Node toolchain only. Language exceptions become
visible trade-offs rather than incidental choices.

## Alternatives

Using JavaScript would remove the compilation step but lose the preferred type
contract. Keeping Go only for workflow linting would add an otherwise unused
toolchain.

## Supersedes

None.

## Open Questions

None.
