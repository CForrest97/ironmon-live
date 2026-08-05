---
id: PRD-003
title: Expand the player-first live channel
status: draft
contexts: []
decisions:
  - DEC-001
  - DEC-002
---

# Expand the player-first live channel

## Problem

The current channel page presents only detailed party data and current-route
trainer progress. The IronMON Tracker can observe richer spoiler-safe tactical
state, but showing all of it together would make an in-play reference hard to
read. A player needs a visually clear live view that works beside mGBA and
reveals deeper reported information only when it is useful.

## Evidence

The [channel-page expansion direction](../discovery/2026-08-01-channel-page-expansion-direction.md)
records the maintainer's requested information hierarchy, data boundary,
visual direction, and split-screen constraint. The
[Tracker extension capability inventory](../../../apps/tracker-extension/capability.md)
establishes technical possibilities. Neither source is independent player
research or evidence that every available field improves play.

## Users

- Primary: a player actively undertaking an IronMON challenge, consulting the
  live channel beside mGBA during play.
- Secondary: a friend or spectator using the same channel page after receiving
  the player's channel code.

The page remains player-first; this specification does not define a separate
spectator presentation.

## Desired Outcomes

- A player can identify the current run state, location, active battle, party
  readiness, and route-trainer progress at a glance in a split-screen desktop
  workspace.
- A player can reveal deeper reported tactical information without losing the
  overview or mistaking unavailable state for a zero or empty value.
- The channel retains PRD-001's live-update outcome while making the expanded
  non-spoiler state useful and visually legible.

## Non-goals

- Battle, route, or team advice; encounter recommendations; or any inferred
  gameplay fact.
- Bag inventory, encounter history, and uncollected-item progress.
- Randomizer-log data, including randomized encounters, future trainer teams,
  evolutions, TM compatibility, seeds, or settings.
- Accounts, authentication, secure channel ownership, public channel discovery,
  run history, or retained final snapshots.
- A distinct spectator layout or mobile-first product surface.
- A compatibility promise for a particular game, Tracker, emulator, operating
  system, image provider, or asset license before it has been validated.

## Scope

Extend the existing player-first channel after the PRD-001 MVP. Present a
compact live overview and focused Party, Battle, Route, and Progress panels.
The page uses game-inspired imagery from a resilient external source where
available, but remains comprehensible when an image cannot load.

The expanded state is limited to the following Tracker-observable,
non-spoiler data:

- rich player-party state;
- active battle, opponents, and reported trainer details;
- current location, route, route trainers, and their reported parties;
- game and Tracker status, badges, timer/playtime, centre heals, and gameplay
  counters.

## Requirements

1. The channel shall preserve the accountless, ephemeral, five-digit channel
   behavior defined by PRD-001 and DEC-001.
2. The initial visible overview shall show run status, current location, an
   active-battle summary when a battle is active, party health and state
   summary, and current-route trainer progress.
3. The overview shall remain compact; detailed values shall be available only
   through clearly named Party, Battle, Route, and Progress panels.
4. The Party panel shall make core identity and condition prominent, then make
   reported level, current and maximum HP, types, status, ability, held item,
   moves and PP, major stats, stat stages, IVs, EVs, nature, experience,
   friendship, gender, shiny state, and PokeRus state available without
   fabricating absent values from a native version 2 producer.
5. The Battle panel shall appear only for reported active battle state and
   shall identify wild or trainer battle, single or double format, active
   combatants, reported opponent or trainer identity, reported parties, moves,
   held items, battle items, and battle outcome.
6. The Route panel shall show the reported current location or route,
   completed and total trainer count, trainer battle status, and reported
   trainer class, identity, portrait where available, party, moves, held
   items, battle items, and double-battle flag.
7. The Progress panel shall show reported ROM and Tracker context, timer or
   pause state, playtime, badges, centre heals, and wild-battle, trainer-battle,
   fishing, and Rock Smash counters.
8. The page shall use game-inspired Pokémon sprites and trainer portraits when
   the selected external asset source supplies them. Pokémon sprites use
   PokéAPI; trainer portraits use the Pokémon Showdown trainer-sprite
   directory when a producer supplies a valid source slug. Missing, failed, or
   unavailable images shall fall back to readable text and type or status
   iconography without changing the factual state shown.
9. At a viewport width of 640 CSS pixels, the page shall have no horizontal
   scrolling or hidden essential overview information; every panel and control
   shall remain readable and operable in the player's desktop split-screen
   workspace.
10. The website shall distinguish reported zero, `false`, and empty values
    from unavailable values throughout the overview and every panel.
11. An expanded canonical Tracker snapshot shall use a new schema version.
    Schema version 1 messages and their current behavior shall remain valid and
    unchanged; producers and consumers shall reject unsupported versions rather
    than silently guessing a field's meaning.
12. The expanded contract shall carry only full current state needed by this
    page, not historical event streams or randomizer-log data. Live delivery,
    stale-state handling, terminal snapshots, and expiry remain governed by
    PRD-001.
13. Until the bundled Tracker extension emits schema version 2, a companion
    receiving schema version 1 may publish the deterministic expanded demo
    state defined by DEC-002 as ordinary available version 2 values. It shall
    retain version 1 facts where available and remove this bridge when the
    extension emits version 2.

## Acceptance Criteria

- In an active run, a player can identify the five overview concerns—run
  status, location, active battle when present, party readiness, and
  route-trainer progress—without opening a detailed panel.
- A shown party member can reveal every available field named in requirement 4
  without crowding the compact overview; unavailable fields remain explicitly
  unavailable.
- An active trainer or wild battle presents the reported context and opponent
  information, while a non-battle view does not reserve distracting empty
  battle content.
- The route and progress panels show only the included reported state and do
  not expose bag inventory, encounter history, randomizer-log data, advice, or
  inferred facts.
- A failed or absent external image does not hide a Pokémon's, trainer's, or
  state information.
- Automated layout coverage verifies the overview and panel operation at 640
  CSS pixels; component coverage verifies disclosure and image fallbacks.
- Contract and transport coverage verifies version 1 compatibility, the new
  expanded snapshot version, available versus unavailable data, and live
  replacement behavior.
- Scenario-based sessions with active IronMON players test party readiness,
  battle state, route progress, and deeper tactical detail during split-screen
  play. Findings are recorded before the hierarchy is described as validated.

## Affected Contexts

None.

## Decisions

- [DEC-001: Use ephemeral, unauthenticated live channels](../../decisions/DEC-001-unauthenticated-live-channels.md)
- [DEC-002: Temporarily publish companion-expanded demo state](../../decisions/DEC-002-temporary-companion-expanded-demo-state.md)

## Risks

- The information hierarchy is maintainer direction, not yet player-validated;
  additional fields may reduce rather than improve in-play comprehension.
- Tracker APIs and game data may omit, vary, or ambiguously label expanded
  fields across configurations.
- External imagery may introduce availability, licensing, visual-consistency,
  and loading-performance risks.
- Adding larger snapshots or asset loading could undermine PRD-001's live
  latency target under supported conditions.
- Detailed opponent information can be useful tactical context but must not be
  presented as advice or extend to spoiler-sensitive randomizer-log data.

## Open Questions

- Do the selected PokéAPI and Pokémon Showdown image sources satisfy the
  required availability, licensing, attribution, and fallback expectations
  under representative player use?
- Which supported Tracker, game, emulator, and operating conditions can
  consistently provide the expanded state and retain the live-update target?
- What scenario-test findings and success threshold are sufficient to accept
  the proposed information hierarchy?
