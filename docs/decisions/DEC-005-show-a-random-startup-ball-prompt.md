---
id: DEC-005
title: Show a random startup ball prompt
status: accepted
category: product
supersedes: []
---

# Show a random startup ball prompt

## Context

[PRD-003](../product/specs/PRD-003-expand-player-first-live-channel.md)
excludes battle, route, and team advice, encounter recommendations, and
inferred gameplay facts. The Tracker reports no candidate starter contents or
evidence from which one could be favoured. The maintainer has directly
requested a small classic-game selection scene for the empty-party startup
moment, including one playful recommendation.

The prompt must not turn an absence of reported party members into an
assertion about an encounter, a ball's contents, or the best gameplay choice.

## Decision

The live channel may show one presentation-only starter-ball prompt when, and
only when, the reported run status is `startup` and the reported party is
empty. It shall:

- show exactly three visually identical, CSS-rendered standard balls, labelled
  Left, Centre, and Right;
- choose one ball randomly in the web component when that empty-party startup
  episode mounts, keep that choice stable for the episode, and label only it
  "Recommended pick";
- make no claim about a ball's contents, encounter, route, battle, party, or
  strategic value; and
- offer no interaction, reroll, Tracker write, persistence, or protocol or
  contract change.

The same presentation applies to valid schema-version-1 and schema-version-2
snapshots. It disappears as soon as the party becomes non-empty or status
leaves `startup`.

## Consequences

- A player receives a light, non-spoiler prompt during a clearly bounded
  empty-party startup moment.
- The visible recommendation is deliberately random and must be described and
  implemented as presentation, never as advice or a fact derived from the
  run.
- The prompt neither expands Tracker observation nor changes the meaning of
  any stored, delivered, or published run state.

## Alternatives

- **Show no recommendation**: rejected because it does not meet the
  maintainer's request for a playful selection prompt.
- **Use Tracker or game data to choose a ball**: rejected because no permitted
  observation establishes a ball's contents or strategic value.
- **Show the prompt whenever a party is empty**: rejected because empty state
  can occur outside the bounded startup moment and would broaden the product
  behaviour.
- **Use external game assets or image sprites**: rejected in favour of
  CSS-rendered artwork that scales crisply and adds no asset dependency.

## Supersedes

None.

## Open Questions

None.
