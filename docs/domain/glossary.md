# Ubiquitous-language glossary

Define a term only when its meaning is supported by discovery. If meanings
differ between bounded contexts, record each context-qualified definition.

| Term | Meaning | Context | Status |
| --- | --- | --- | --- |
| IronMON Live | A live companion that presents IronMON Tracker run information for a player and people following that player. | Product | Draft |
| IronMON challenge | The hardcore gameplay challenge undertaken by a player; supported rulesets remain to be identified. | Shared | Draft |
| Player | A person actively undertaking an IronMON challenge and using the companion. | Shared | Draft |
| Live channel | The stable destination at which a player's current ephemeral run state can be viewed. | Product | Draft |
| Channel code | The five-digit identifier retained by a companion and used to publish and view a live channel; it is not a security credential. | Product | Draft |
| Run state | The current information about an IronMON challenge that is observable through the IronMON Tracker. | Shared | Draft |
| Base-stat randomization | The randomizer's reassignment of each species' base stat spread when the ROM is built, so a species' stats differ per seed; independent of a Pokémon's IVs, EVs, and nature, which still follow standard game rules. | Shared | Draft |
| Base stat total (BST) | The sum of a Pokémon's six randomized base stats; read as a mon's raw potential independent of its current level, nature, IVs, and EVs. | Product | Draft |
| Nature | A fixed modifier that raises one stat 10% and lowers another 10% (five natures are neutral); unaffected by base-stat randomization. | Shared | Draft |
| Active run | A run whose companion has supplied a heartbeat within the expiry window. | Product | Draft |
| Active channel | A live channel currently showing an active run; listed on the homepage with a bounded run preview per DEC-003 and DEC-004. | Product | Draft |
| Route-trainer progress | The trainers reported for the current route and whether each has been battled. | Product | Draft |
| Publishing session | The period beginning when a local companion launches, during which it publishes schema-compliant run state to a live channel. | Product | Draft |

## Conventions

- Prefer the domain's language over implementation synonyms.
- Use singular nouns for concepts and present-tense verbs for actions.
- Link terms to the context that owns their rules when that boundary exists.
- Mark uncertain definitions as draft rather than presenting them as facts.
