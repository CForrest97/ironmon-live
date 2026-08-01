---
id: WORK-006
title: Deploy production automatically from main
status: in-progress
kind: repository
artifacts:
  - PRD-001
---

# Deploy production automatically from main

## Intent

Make a successful merge to `main` the source of a production application
deployment and prevent repository action-policy drift from stopping workflows
before their jobs start.

## Outcome

Every push to `main` validates and deploys the Cloudflare application through
GitHub Actions. Pinned third-party actions used by workflows must also appear in
the repository's selected-action policy.

## Context

- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
- [MVP application stack](../../docs/repository/application-stack.md)
- [Production infrastructure](../../infra/README.md)

The first production infrastructure run failed at workflow startup because the
committed selected-action policy allowed the pinned OpenTofu setup action but
the live repository setting had not yet been reconciled.

## Scope

Trigger the existing Wrangler deployment workflow for every push to `main`,
retain manual dispatch for recovery, validate the trigger and selected-action
policy mechanically, add infrastructure recovery dispatch, and reconcile the
live action policy. Do not change product behavior, provision additional
infrastructure outside GitHub Actions, or commit local build, OpenTofu, or
Wrangler output.

## Acceptance Criteria

- Every push to `main` triggers the production application deployment.
- Manual application deployment remains available.
- Manual infrastructure dispatch is available when a startup failure cannot be
  rerun.
- Every external action remains pinned to a full commit SHA.
- Every non-GitHub action used by a workflow is permitted by the committed
  selected-action policy.
- Local `dist`, `.terraform`, `.wrangler`, state, plan, variable, and companion
  configuration artifacts remain ignored.
- Repository checks pass.

## Plan

Update the deploy trigger and production documentation, extend workflow-policy
validation with regression tests, apply the selected-action policy to GitHub,
and validate the complete repository.

## Validation

`npm run check` passes all repository validation and tests. The live GitHub
selected-action policy now matches `.github/selected-actions.json`. GitHub does
not permit rerunning the original startup-failed workflow; changing the
infrastructure workflow causes a fresh plan/apply run when this work merges.

## Agent Notes

Assumption: “merge to main” means every push to `main`, including merges that
only change documentation. The deployment workflow reruns repository checks
before Wrangler can change production.
