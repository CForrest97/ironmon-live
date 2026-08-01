---
id: DEC-001
title: Use ephemeral, unauthenticated live channels
status: proposed
category: product
supersedes: []
---

# Use ephemeral, unauthenticated live channels

## Context

Players currently send screenshots to friends, while the desired experience is
for another person to follow current run state without creating additional work
for the player. The initial product does not require accounts, search, or
permanent run records. The maintainer prefers a small code that stays with the
player across runs and explicitly does not require a separate secret value for
this version.

The evidence and interpretation behind this proposal are recorded in the
[initial player-companion discovery note](../product/discovery/2026-07-31-initial-player-companion.md).

## Decision

Give a companion a five-digit channel code that it retains and reuses across
play sessions and runs. Launching the companion immediately publishes the
current run state to that channel. Anyone with the code can view the channel
without an account or approval.

Do not require a separate publishing secret in this version. Treat the code as
an identifier, not a security credential or proof of ownership.

Run content is ephemeral: after a configurable period between 30 and 60 minutes
without a heartbeat, the channel shows no active run and retains no final
snapshot. The channel code remains available for a later run.

Use 30 minutes as the initial expiry value. Treat every companion launch as a
new publishing session. If publishers compete for the same channel code, the
latest valid publication replaces the current state; this is collision
behavior, not channel ownership.

## Consequences

- Players can reuse and share a short, stable destination without managing an
  account or explicitly starting a sharing session.
- Friends can bookmark a channel and see later active runs at the same
  destination.
- Codes are guessable because only 100,000 five-digit values exist. The product
  cannot promise private viewing.
- Without a separate publishing credential, the product cannot securely prove
  channel ownership or prevent another client from attempting to publish to a
  known code.
- The product must not describe channels as secure or locked to a player.
- Competing publishers may continually replace one another, because the
  product deliberately provides no ownership credential in this version.
- Stronger authentication or ownership controls can be proposed later if
  observed misuse or changed product needs justify them.

## Alternatives

- Use an unguessable public link. This would reduce casual discovery but would
  not meet the maintainer's preference for a small five-digit code.
- Use a public channel code plus a private publishing secret. This would protect
  publishing without requiring accounts, but the maintainer explicitly deferred
  a secret value for this version.
- Require player accounts. This could support recovery and enforce ownership,
  but adds setup and identity management that the initial ephemeral product does
  not require.
- Create a new link for every run. This would isolate runs but would prevent
  friends from returning to a stable player destination.

## Supersedes

None.

## Open Questions

- What evidence or misuse threshold should trigger reconsideration of a private
  publishing credential?
