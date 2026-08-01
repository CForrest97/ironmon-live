# Initial player-companion interview and PoC review

## Date and source

Gathered on 2026-07-31 through a conversation with the repository maintainer
and inspection of a maintainer-provided proof-of-concept IronMON Tracker
extension script. The conversation is the source for stated product direction;
it is not independent user research.

## Question

What problem should IronMON Live address first, for whom, and what information
and sharing behavior can the Tracker integration plausibly support?

## Observations

- The maintainer said the product should optimize first for players undertaking
  an IronMON challenge.
- Players currently use an unattractive command-line script continuously while
  playing and send screenshots to friends.
- The maintainer identified detailed party Pokémon information and current
  route progress as the most important information needs. Encounter and battle
  information may be deferred.
- Required party details named by the maintainer were IVs, EVs, stats, moves,
  and types.
- Desired route progress included a count such as one of two trainers battled.
- The maintainer requested updates within one second.
- The maintainer described run information as ephemeral and accepted the live
  view becoming empty after 30 to 60 minutes without a heartbeat.
- The maintainer wanted a stable destination for the player across runs, using
  a five-digit code retained by the companion.
- The maintainer said accounts, authentication, and a separate secret value are
  not required for this version.
- The maintainer said launching the companion should begin publishing
  immediately, without a separate sharing action.
- Search and discovery of players are not required. Anyone with the code may
  view the live state.
- The inspected PoC exports rich player-party details, the current location,
  trainers on the route and their defeated state, inventory, badges, run
  status, and other information.
- The PoC does not export uncollected items on the current route. The
  maintainer chose to omit inventory and defer route-item progress.
- The PoC writes snapshots after program and battle updates. If state is
  unchanged, it suppresses another write for up to two seconds. End-to-end
  update latency was not measured.

## Interpretation

- The first product hypothesis is that a continuously updated, player-first
  visual companion will make essential run information easier to use during a
  challenge than the existing command-line presentation.
- Remote viewing can remove manual screenshot sharing without requiring a
  separate spectator product initially.
- The useful live content is ephemeral, while the destination used to reach a
  player's current content is durable.
- Tracker output is a hard capability boundary. IronMON Live should expose
  unavailable information honestly rather than infer it.
- A five-digit code without a separate secret offers convenience but not
  private viewing or enforceable publisher ownership. Calling the channel
  “locked to a player” would overstate the supported guarantee.
- The requested one-second update is a target supplied by the maintainer, not
  yet evidence of achievable end-to-end performance or user tolerance.

## Follow-up

- Validate the workflow and information hierarchy with people actively playing
  an IronMON challenge.
- Measure Tracker-to-view latency under representative supported conditions.
- Identify the initial supported games, rulesets, and Tracker versions.
- Test whether players can understand party details and route-trainer progress
  more easily than with the existing command-line view.
- Define behavior for lifecycle states and competing use of the same channel
  code.
- Revisit route-item progress only if the Tracker exposes trustworthy source
  data.
- Use this note as evidence for
  [PRD-001](../specs/PRD-001-live-player-companion.md) and
  [DEC-001](../../decisions/DEC-001-unauthenticated-live-channels.md).
