# Agent operating contract

## Mission

Help shape IronMON Live without turning assumptions into facts. Product and
domain documents are the repository's source of truth; implementation follows
them rather than defining them accidentally.

## Source-of-truth order

When artifacts conflict, use this precedence and surface the conflict:

1. Accepted decision records.
2. Accepted product specifications and active bounded contexts.
3. Product foundations, domain narrative, glossary, and context map.
4. Draft specifications, proposed decisions, and discovery notes.

Never silently resolve a contradiction. Record it as an open question or
propose a decision record.

## Before changing anything

1. Read the product brief and principles.
2. Read the glossary and relevant bounded contexts.
3. Read linked specifications and decisions.
4. State any remaining assumption explicitly in the artifact or pull request.

## Change workflow

- Work on a focused branch and merge through a pull request.
- Give governed artifacts stable IDs and keep their cross-references current.
- Promote GitHub issue discoveries into versioned documents before treating
  them as accepted knowledge.
- Update product/domain documents in the same change as behavior they govern.
- Run `npm run check` before declaring work complete.

## Guardrails

- Do not invent users, requirements, domain rules, or acceptance criteria.
- Preserve uncertainty in a draft artifact's `Open Questions` section.
- Do not mark an artifact accepted or active while it contains placeholders or
  unresolved questions.
- Do not add an application framework until the stack has been deliberately
  selected and recorded.
- Prefer the smallest rule or automation that addresses observed friction.

## Definition of done

A change is complete when its intent is documented, affected product/domain
artifacts and references agree, durable trade-offs are recorded, all checks
pass, and the pull request contains no hidden assumptions.
