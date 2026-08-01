---
id: WORK-004
title: Build the live player companion MVP
status: in-progress
kind: product
artifacts:
  - PRD-001
  - DEC-001
---

# Build the live player companion MVP

## Intent

Create the smallest end-to-end implementation that can validate the live
player-companion hypothesis and one-second delivery target without treating
unvalidated usability as accepted product truth.

## Outcome

A future Lua extension can write a canonical snapshot file, a local TypeScript
service can publish it to an ephemeral Cloudflare channel, and an unauthenticated
viewer can follow current party and route-trainer state in a player-first web
view.

## Context

- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
- [DEC-001](../../docs/decisions/DEC-001-unauthenticated-live-channels.md)
- [MVP application stack](../../docs/repository/application-stack.md)

## Scope

Implement the shared schema, local npm CLI, live Cloudflare channel, React
view, OpenTofu production infrastructure, CI workflows, and focused automated
validation. Specify but do not implement the Lua producer. Do not add accounts,
history, inventory, encounter or battle data, public discovery, or a distinct
spectator experience.

## Acceptance Criteria

- Available zero and empty values remain distinct from unavailable values.
- A companion generates and retains a five-digit code, rejects stale input,
  and publishes valid atomic file replacements.
- The latest publisher controls a channel, viewers receive live replacements,
  and expiry deletes the active snapshot while preserving the channel code.
- Terminal snapshots retain their exact reported status until expiry.
- At least 95% of representative measured updates reach an already-connected
  viewer within one second under recorded conditions.
- OpenTofu validates the independently managed production infrastructure and
  uses remote R2 state without committing credentials or state.
- Repository checks pass and usability evidence remains explicitly open.

## Plan

Build the shared contract first, then the local and cloud transports, player
view, infrastructure automation, and validation harness. Reconcile the product
and domain artifacts with every behavior selected during implementation.

## Validation

`npm run build` produces the companion CLI, Cloudflare Worker, and React client.
`npm run check` passes Markdown linting, formatting, strict ESLint and
TypeScript checks, documentation and workflow validation, the fifteen existing
repository tests, and seven focused application tests. `npm audit
--audit-level=high` reports no vulnerabilities. OpenTofu 1.11.6 initializes the
pinned Cloudflare 5.22.0 provider, writes its dependency lock file, and reports
the production configuration valid.

The local development server starts successfully. Visual browser inspection,
the deployed file-to-viewer latency measurement, remote R2 backend access, and
player usability comparison require their target environments and remain
outstanding. The synthetic latency test checks local publication overhead but
is not accepted as evidence for the end-to-end product criterion.

The first GitHub Actions run exposed that the watcher test replaced its file
before the polling watcher had established a baseline on Linux. The focused
test now waits for that baseline, and the repository action allowlist includes
the pinned OpenTofu setup action used by the infrastructure workflow.

## Agent Notes

Assumption: schema conformance is the MVP compatibility boundary; it is not
evidence that any specific game, Tracker, emulator, or operating-system setup
is supported.
