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
same run state without an account or approval. Anyone visiting the homepage
can also discover the code of every channel with an active run, alongside a
small run preview (the lead party member's sprite and name, the current
location/route name, and the game), without having been given the code, per
[DEC-003](../decisions/DEC-003-list-active-channels-on-homepage.md) and
[DEC-004](../decisions/DEC-004-show-a-bounded-run-preview-on-homepage-channel-cards.md);
the homepage never shows player name, HP or other party-member stats, trainer
detail, battle state, or badges.

Run state is ephemeral. When no heartbeat has arrived for 30 minutes by
default, the live channel no longer shows a run. The configured expiry may be
between 30 and 60 minutes. The stable channel remains
available for the player's next run, but no completed run or final snapshot is
retained.

Each local companion launch establishes a publishing session. The latest valid
publisher wins when multiple companions use the same channel code; this does
not establish ownership. Terminal run details remain visible with the exact
Tracker-reported status until the heartbeat expires. Startup, unsupported
input, and invalid input show no active run.

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

- Does later evidence justify distinct domain boundaries for observing a run
  and presenting a live channel?
- Which operating conditions consistently meet the latency criterion?
