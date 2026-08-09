---
id: WORK-014
title: Add a release tag helper
status: in-progress
kind: repository
artifacts:
  - PRD-002
---

# Add a release tag helper

## Intent

Make the established companion-release tag trigger easy to run without
changing its branch-neutral behavior.

## Outcome

An operator can run one repository command with a version to create and push
the corresponding release tag.

## Context

- [PRD-002](../../docs/product/specs/PRD-002-companion-utility.md) requires
  official companion distribution.
- [WORK-008](WORK-008-ship-tauri-companion.md) established the tag-triggered
  companion release workflow.

## Scope

Add a shell helper and npm command for creating and pushing a semantic-version
tag to `origin`. Refuse an already-existing local or remote tag. Do not publish
artifacts locally, push a branch, or impose a branch restriction.

## Acceptance Criteria

- `npm run release:tag -- 0.1.19` creates and pushes `v0.1.19`.
- The helper accepts an optional `v` prefix and rejects malformed versions.
- The helper leaves existing local and remote tags untouched.
- The release procedure is documented and repository checks pass.

## Plan

Implement the smallest shell wrapper around the existing Git tag trigger,
document its invocation, and validate its static behavior and repository
checks.

## Validation

- `bash -n scripts/push-release-tag.sh` passed.
- `npm run release:tag -- not-a-version` rejected malformed input with exit
  status 2.
- In a disposable local repository and bare `origin`, the helper normalized
  `0.1.19`, created and pushed `v0.1.19`, and rejected a duplicate local tag
  with exit status 1.
- `npm run check` passed, including the local Playwright browser check after
  local loopback binding was permitted.

## Agent Notes

The maintainer explicitly requires releases to remain possible from any
branch, so this helper intentionally does not assert `main`.
