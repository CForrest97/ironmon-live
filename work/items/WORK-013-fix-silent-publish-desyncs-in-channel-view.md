---
id: WORK-013
title: Fix silent publish desyncs in channel view
status: in-progress
kind: repository
artifacts:
  - PRD-001
---

# Fix silent publish desyncs in channel view

## Intent

The maintainer reported recurring desyncs in the channel view that seem to
follow publish errors and "fix themselves eventually," with practically no
visibility into why. Untracked before this item — no work item or code
comment previously referenced "desync."

## Outcome

Publish failures are logged where they occur (worker registry PUT failures,
sessionId-mismatched heartbeats, publish parse failures), the companion
retries state-changing publishes more aggressively than keep-alive
heartbeats, and the channel view distinguishes "my own connection dropped"
from "the companion is stuck retrying and this data may be stale" instead of
silently showing outdated run state with no indication.

## Context

- `apps/companion/src/desktop/controller.ts` — `scheduleRetry` previously
  used one shared 1s→30s backoff ceiling for both snapshot and heartbeat
  publish failures.
- `apps/web/worker/channel.ts` `publish()` — only `snapshot` publishes ever
  broadcast to viewers; heartbeat publishes silently updated `expiresAt`
  (or silently dropped on sessionId mismatch) with zero logging and no
  viewer signal.
- `apps/web/src/channel.ts` `subscribeToChannel` — the `connected` state
  only reflects the viewer's own WebSocket health, never whether the
  companion's own publishes are reaching the worker.
- `apps/web/wrangler.jsonc` had no `observability` block; no Sentry or
  Analytics Engine binding exists in this repo — Cloudflare Workers Logs
  (built-in, zero new infrastructure) is the logging path used here.
- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
  (context only; this is a reliability fix, not a new product decision)

## Scope

Add worker-side logging at the three identified failure points, enable
Cloudflare Workers Logs, add a `heartbeat` `ChannelEvent` variant broadcast
on every successful heartbeat publish, tighten the companion's retry
ceiling for state-changing publishes, and add a viewer-side staleness signal
distinct from the existing disconnect banner. Do not add a new logging
vendor/service, a delta/patch sync protocol, or a companion-side persistent
log file.

## Acceptance Criteria

- Worker logs (queryable via `wrangler tail`/dashboard) on: registry PUT
  failure, sessionId-mismatched heartbeat, and publish parse failure.
- The worker broadcasts a `heartbeat` event to viewers on every successful
  heartbeat publish; the viewer does not render this as `active`/`inactive`
  state.
- A companion snapshot-publish failure retries with a tighter ceiling
  (8s) than the prior shared 30s ceiling; a stale-message parse on the
  viewer socket no longer force-closes the connection.
- The channel view shows a distinct "run data may be out of date" banner
  when connected but no message has arrived for a threshold window, without
  affecting the existing "reconnecting" banner's behavior on a real socket
  drop.
- `npm run check` passes.

## Plan

See `packages/contracts/src/index.ts` (`ChannelEvent` heartbeat variant),
`apps/web/worker/channel.ts` (logging + heartbeat broadcast),
`apps/web/wrangler.jsonc` (`observability.enabled`), `apps/web/src/channel.ts`
(`onActivity` callback, non-fatal parse-failure handling),
`apps/web/src/App.tsx` (staleness timer + banner), and
`apps/companion/src/desktop/controller.ts` /`types.ts` (per-kind retry
ceiling, surfaced `retryAttempt`).

## Validation

`npm run check` passes (typecheck, lint, docs/workflow validation, full test
suite across workspaces, including new contract round-trip tests for the
`heartbeat` `ChannelEvent` variant and companion retry-ceiling tests).

Manually verified against `wrangler dev` (via the web app's Vite dev
server) and a live channel:

- Publishing a `heartbeat` broadcasts to the connected viewer without
  flashing "No active run" (confirms heartbeat events don't reach
  `App.tsx`'s render state).
- Withholding heartbeats for 9s surfaces "Run data may be out of date —
  waiting for an update." in the DOM; publishing one fresh heartbeat clears
  it immediately.
- Publishing a heartbeat with a mismatched `sessionId` logs
  `heartbeat dropped: sessionId mismatch { code, expected, got }` via
  `wrangler`'s dev logs, confirms the new observability path fires.

## Agent Notes

The originally planned "heartbeat retries get a longer 30s ceiling than
snapshot retries" distinction turned out to be largely unobservable in
practice: `scheduleRetry`'s scheduled callback always re-invokes
`publishLatest` regardless of which publish failed, so any sustained
failure chain becomes "snapshot"-classified after its first attempt. The
practical, tested outcome is that sustained failure chains are now capped
at the tighter 8s ceiling (previously 30s) — a straightforward recovery-time
improvement, not the origin-based distinction as first described in the
plan.
