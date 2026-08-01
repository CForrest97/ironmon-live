# Companion utility product direction

## Date and source

Gathered on 2026-08-01 from the repository maintainer's request for a PRD for
a macOS-first IronMON Live companion application. This is maintainer product
direction, not independent user research.

## Question

What is the smallest local utility that can reliably bridge a supported
IronMON Tracker setup to the IronMON Live website while staying out of the
player's way?

## Observations

- The website is the primary product and the place where players and viewers
  should spend their time.
- The requested companion should feel like a native background utility, live
  in the macOS menu bar, offer a small settings surface, and optionally start
  at login.
- The requested responsibilities include finding a supported local setup,
  connecting to the running game, reading state, publishing updates, showing
  status, handling authentication, recovering from failures, and minimizing
  manual configuration.
- The initial platform emphasis is macOS, but the product should avoid
  unnecessary platform-specific assumptions.
- The maintainer asked for critical evaluation of the split between the local
  utility, website, and Lua Tracker extension; lifecycle and connectivity
  behavior; update cadence; onboarding; and whether a companion is the right
  solution.
- The downloadable application should be distributed from a Cloudflare-hosted
  object bucket.

## Interpretation

- A local component is justified because a website cannot reliably observe
  local Tracker state by itself without repeated player intervention or a
  broader browser capability. Its value is the bridge, not a second run-viewing
  experience.
- Detecting an emulator process is a weak proxy for readiness. The useful v1
  signal is whether the supported Tracker integration is producing valid run
  state. Process-level detection may add platform coupling and false confidence.
- Game-aware observation belongs in the Lua extension because it is closest to
  Tracker semantics. The companion should supervise local readiness, validate
  and publish observable state, and explain recovery. The website should own
  run presentation and remote viewer behavior.
- Prompt event-driven updates plus a periodic liveness heartbeat balance the
  one-second product target with quiet background operation.
- Existing product direction explicitly defers accounts and secure channel
  ownership. “Handle authentication” therefore requires clarification rather
  than silently introducing sign-in or claiming that a five-digit channel code
  authenticates its publisher.

## Follow-up

- Test installation and first-run recovery with non-technical IronMON players.
- Validate which named macOS, emulator, Tracker, and game versions are actually
  supportable before making compatibility claims.
- Decide whether publisher authentication is a v1 requirement, revising the
  proposed unauthenticated-channel decision if necessary.
- Define release integrity, update, rollback, retention, and access expectations
  for Cloudflare-hosted downloads before accepting the specification.
- Use this note as evidence for
  [PRD-002](../specs/PRD-002-companion-utility.md).
