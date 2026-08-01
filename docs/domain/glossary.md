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
| Active run | A run whose companion has supplied a heartbeat within the expiry window. | Product | Draft |
| Route-trainer progress | The trainers reported for the current route and whether each has been battled. | Product | Draft |
| Publishing session | The period beginning when a local companion launches, during which it publishes schema-compliant run state to a live channel. | Product | Draft |

## Conventions

- Prefer the domain's language over implementation synonyms.
- Use singular nouns for concepts and present-tense verbs for actions.
- Link terms to the context that owns their rules when that boundary exists.
- Mark uncertain definitions as draft rather than presenting them as facts.
