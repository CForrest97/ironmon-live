# Domain narrative

The domain narrative will explain the real-world activity IronMON Live supports,
using domain language instead of implementation terminology.

## Current understanding

A player undertakes an IronMON challenge in a game supported by the IronMON
Tracker on mGBA. While playing, the player runs a local companion. The
companion immediately begins publishing run state observable through the
Tracker to the player's live channel; the player does not separately start a
sharing session.

The player keeps the live view available throughout play. They use it to read
detailed information about current party Pokémon, including IVs, EVs, stats,
moves, and types, and to see route-trainer progress such as one of two trainers
battled. Information should change in the view within one second of becoming
available under supported conditions.

The companion retains a stable five-digit channel code, so later runs appear
at the same destination. A friend or spectator with that code may view the
same run state without an account or approval. The product does not offer
search or public discovery of channels.

Run state is ephemeral. When no heartbeat has arrived for between 30 and 60
minutes, the live channel no longer shows a run. The stable channel remains
available for the player's next run, but no completed run or final snapshot is
retained.

The Tracker limits what IronMON Live can know. The product presents reported
facts and does not infer hidden run state. In particular, current inventory is
not part of the initial view, and remaining route-item progress is deferred
because the inspected proof of concept does not export it.

## Modeling guidance

- Describe actors, goals, rules, events, and exceptions in chronological prose.
- Use glossary terms consistently and link context-specific meanings.
- Highlight invariants and policy decisions rather than database operations.
- Keep unknowns explicit until evidence or an accepted decision resolves them.

## Open questions

- Which games, rulesets, and Tracker versions are supported initially?
- What precisely starts a new run when a channel previously showed another
  run?
- What should the live channel show during startup, an unsupported game, game
  over, completion, or companion unloading?
- How is a channel-code collision or competing publisher handled without a
  secret publishing credential?
- Does later evidence justify distinct domain boundaries for observing a run
  and presenting a live channel?
