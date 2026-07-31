---
id: PRD-001
title: Provide an ephemeral live player companion
status: draft
contexts: []
decisions:
  - DEC-001
---

# Provide an ephemeral live player companion

## Problem

Players consult IronMON Tracker information continuously while undertaking a
hardcore challenge, but the current command-line presentation is difficult to
use at a glance. Sharing the current run with friends also requires manually
taking and sending screenshots.

## Evidence

The [initial player-companion discovery note](../discovery/2026-07-31-initial-player-companion.md)
records the maintainer's description of current behavior, desired information,
and product constraints. It also records inspection of the Tracker-extension
PoC. This is product input and technical feasibility evidence, but not yet
independent validation with players.

## Users

- Primary: a player actively undertaking an IronMON challenge with the IronMON
  Tracker on mGBA and consulting run information throughout play.
- Secondary: a friend or spectator whom the player has given the stable channel
  code.

The initial product is optimized for the player. Spectator-specific needs have
not yet been discovered.

## Desired Outcomes

- A player can understand detailed current-party information and current-route
  trainer progress at a glance during play.
- Run-state changes observable by the Tracker appear in the live view within
  one second under supported operating conditions.
- A player can let another person follow the current run without repeatedly
  taking and sending screenshots.

## Non-goals

- Search, directories, or public discovery of players or channels.
- Accounts, authenticated viewing, or secure channel ownership in this version.
- Permanent run history or retention of a final run snapshot.
- Encounter or battle information.
- Inventory or remaining route-item progress.
- Spectator-specific features or presentation.
- Inferring information that the Tracker does not report.

## Scope

When the local companion is running, it publishes Tracker-observable run state
immediately to a stable live channel identified by a retained five-digit code.
The player and anyone given that code can view the current state without an
account. The view focuses on current-party details and current-route trainer
progress. It stops showing a run after the heartbeat expiry window, while the
channel remains available for a later run.

## Requirements

1. Launching the companion begins publishing available run state without a
   separate start-sharing action.
2. A companion retains and reuses the same five-digit channel code across play
   sessions and runs.
3. A viewer can use the channel code to open the live state without an account
   or access approval.
4. The player view shows every current party Pokémon reported by the Tracker.
5. For each reported party Pokémon, the view shows its IVs, EVs, stats, moves,
   and types.
6. The view shows the current route and which reported trainers on that route
   have been battled, including completed and total trainer counts.
7. A run-state change observable by the Tracker is reflected in the live view
   within one second under supported operating conditions.
8. When no heartbeat has been received for the configured expiry period between
   30 and 60 minutes, the channel shows no active run.
9. Expiry removes the live run state but does not retire the stable channel
   code.
10. The product does not retain or expose a completed run or final snapshot
    after expiry.
11. The view distinguishes unavailable information from a meaningful zero or
    empty value and does not infer facts absent from Tracker output.
12. The product does not describe the five-digit channel code as private,
    secure, or proof of player ownership.

## Acceptance Criteria

- With a supported game and Tracker configuration, starting the companion
  causes the player's live channel to show the reported current party without a
  separate sharing action.
- Each shown party member presents the reported IVs, EVs, stats, moves, and
  types without revealing values unavailable from the Tracker.
- When the Tracker reports one of two current-route trainers as battled, the
  live view shows one completed trainer out of two and identifies the reported
  completion state consistently.
- In a measured supported setup, a representative change to party or
  route-trainer state becomes visible in an already-open live view within one
  second.
- A second viewer can open the same live channel using only its code and observe
  the same current run state without signing in.
- Starting a later run from the same retained companion configuration reuses
  the same channel code and does not expose the prior expired run.
- After the configured period between 30 and 60 minutes without a heartbeat,
  the channel shows no active run or retained final snapshot.
- Inventory, remaining route-item progress, encounter information, and battle
  information do not appear in the initial view.

## Affected Contexts

None.

## Decisions

- [DEC-001: Use ephemeral, unauthenticated live channels](../../decisions/DEC-001-unauthenticated-live-channels.md)

## Risks

- The problem and proposed information hierarchy come from maintainer input,
  not yet direct observation or validation with players.
- Tracker callbacks or downstream delivery may not support the one-second
  end-to-end target consistently.
- Tracker limitations or version differences may make fields unavailable or
  semantically inconsistent.
- A five-digit code is guessable, and without a publishing secret another
  client may view or overwrite a channel.
- Immediate publishing may surprise a player who does not realize that running
  the companion makes data remotely accessible.
- A player-first layout may be usable but insufficient for spectators.

## Open Questions

- Which game, IronMON ruleset, Tracker version, and operating conditions define
  initial support?
- What exact expiry value between 30 and 60 minutes should be used?
- What should viewers see during startup, unsupported-game, game-over,
  completed, and unloading states?
- What marks a new run when a stable channel previously carried another run?
- How should collisions or concurrent publishers using the same five-digit code
  behave?
- What usability evidence is sufficient to show improvement over the existing
  command-line view?
