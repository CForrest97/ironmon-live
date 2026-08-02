# Channel-page expansion direction

## Date and source

Gathered on 2026-08-01 from the repository maintainer's request to create a
follow-on product specification for the IronMON Live channel page. This is
maintainer product direction, not independent user research.

## Question

How should IronMON Live make better use of spoiler-safe Tracker-observable run
state without replacing a player-friendly live view with an unreadable data
dump?

## Observations

- The current channel page presents party details and current-route trainer
  progress, while the Tracker extension capability inventory describes a
  broader set of live, party, battle, route, trainer, and run-progress data.
- The maintainer wants the channel page to make better use of those
  capabilities, but considers clear, attractive presentation more valuable
  than showing every value at once.
- The primary reader remains a player actively undertaking a challenge;
  viewers use the same page rather than a separate spectator experience.
- The requested visual direction is game-inspired cards with Pokémon sprites
  or trainer portraits where available, backed by resilient external assets
  and text or icon fallbacks.
- The page should present a compact "what matters now" overview followed by
  focused Party, Battle, Route, and Progress panels.
- The requested data scope includes rich party data, live battle and opponent
  context, location and route-trainer detail, badges, timers, heals, and run
  counters. Bag inventory and encounter history are deferred.
- Randomizer-log data remains excluded because it is spoiler-sensitive.
- The player needs to use the page beside mGBA in a split desktop workspace;
  the chosen minimum channel-page width is 640 CSS pixels.
- The maintainer wants scenario-based testing with active IronMON players
  before treating the information hierarchy as validated.

## Interpretation

- Progressive disclosure is the product constraint: the overview must support
  an in-play glance, while panels can carry the deeper reported detail needed
  for a decision.
- The existing version 1 canonical schema is intentionally limited to party
  and route progress. A richer channel requires a new versioned contract,
  rather than silently widening or weakening version 1.
- The capability inventory establishes technical possibility, not evidence that
  each field is valuable, consistently available, or understood by players.
- Externally hosted imagery can support the desired visual language, but the
  eventual asset source needs availability, licensing, and fallback review
  before implementation claims are made.

## Follow-up

- Use this note as evidence for
  [PRD-003](../specs/PRD-003-expand-player-first-live-channel.md).
- Test representative in-play scenarios with active IronMON players, including
  identifying party readiness, battle state, route progress, and deeper
  tactical detail in a split-screen setup.
- Select and validate an image source for Pokémon sprites and optional trainer
  portraits before implementation.
- Establish which Tracker, game, emulator, and schema-version combinations can
  report the expanded fields reliably.
