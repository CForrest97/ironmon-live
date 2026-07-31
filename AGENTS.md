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
4. Active repository learnings and collaborator preferences.
5. Draft specifications, proposed decisions, work items, and discovery notes.

Never silently resolve a contradiction. Record it as an open question or
propose a decision record.

## Before changing anything

1. Read the product brief, principles, and accepted repository decisions.
2. Read the glossary and relevant bounded contexts.
3. Read the current work item, linked artifacts, and active learnings.
4. State any remaining assumption explicitly in the artifact or pull request.

## Change workflow

- Work on a focused branch and merge through a pull request.
- Start or update a versioned `WORK-###` file; do not use GitHub Issues to
  manage work.
- Give governed artifacts stable IDs and keep their cross-references current.
- Update product/domain documents in the same change as behavior they govern.
- Prefer TypeScript for repository and application code whenever the platform
  supports it. Record and justify exceptions in the work item.
- Run `npm run check` before declaring work complete.

## Learning loop

When a correction, failed check, review comment, or unexpected outcome reveals
a reusable lesson:

1. Record the observation and evidence in the current work item.
2. Check existing `LRN-###` records for the same underlying cause.
3. Create or update a learning record when the lesson can improve future work.
4. Change at least one prevention mechanism: agent guidance, validation, a
   regression test, a template, or an evaluation fixture.
5. Link the learning and prevention evidence from the work item.

Do not create learning records for one-off typos with no reusable lesson. Do not
silently change accepted product or domain decisions in the name of learning.
All learning changes remain reviewable through the normal pull-request flow.

## Guardrails

- Do not invent users, requirements, domain rules, or acceptance criteria.
- Preserve uncertainty in a draft artifact's `Open Questions` section.
- Do not mark an artifact accepted or active while it contains placeholders or
  unresolved questions.
- Do not add an application framework until the stack has been deliberately
  selected and recorded.
- Prefer the smallest rule or automation that addresses observed friction.
- Never represent a GitHub Issue as the source of a work item.

## Definition of done

A change is complete when its intent is documented, affected product/domain
artifacts and references agree, durable trade-offs are recorded, all checks
pass, the work item captures validation and learning, and the pull request
contains no hidden assumptions.
