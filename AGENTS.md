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
4. Draft specifications, proposed decisions, work items, and discovery notes.

Never silently resolve a contradiction. Record it as an open question or
propose a decision record.

## Before changing anything

1. Read the product brief and principles.
2. Read the glossary and relevant bounded contexts.
3. Read the current work item and linked product/domain artifacts.
4. State any remaining assumption explicitly in the artifact or pull request.

## Change workflow

- Work on a focused branch and merge through a pull request.
- Start or update a versioned `WORK-###` file; do not use GitHub Issues to
  manage work.
- Give governed artifacts stable IDs and keep their cross-references current.
- Update product/domain documents in the same change as behavior they govern.
- Prefer TypeScript for program logic. Thin scripts that mostly orchestrate
  commands may use shell.
- Invoke `$typescript-expert` whenever a change creates or modifies `.ts` or
  `.tsx` files; do not load it for changes without TypeScript.
- Run `npm run check` before declaring work complete.

## Learning loop

When feedback or a failure reveals a reusable lesson, update one concise bullet
under `Learned rules` and add a focused test or validator when the rule can be
checked mechanically. Merge overlapping bullets. Keep incident detail in the
work item, not in startup context. Never change product/domain truth in the name
of learning.

## Learned rules

- Prefer TypeScript for program logic; thin command orchestration may use shell.
- Manage work only through `WORK-###` Markdown files, never GitHub Issues.
- Let file-watcher tests establish their polling baseline before replacing files.
- Do not grant capability identifiers to Tauri plugins that expose no commands or permissions.
- Attach Tauri HTTP URL allowlists to `http:allow-fetch`; `http:scope` is not a permission.
- Resolve Tauri bundle resources from the directory containing `tauri.conf.json`.
- Generate, explicitly configure, and validate Tauri application icons before
  tagging a native release.
- Build the Tauri macOS `app` target whenever updater artifacts are enabled.
- Declare and validate `serde_json` as a direct Rust dependency when using
  Tauri's generated context macro.
- Exclude Tauri build output from repository-wide linting.

## Independent review gate

Before merging any agent-authored change:

1. Delegate the branch diff to the `risk_reviewer` custom agent and explicitly
   invoke `$review-change`.
2. Use a reviewer model different from the implementation model when available.
3. Post the reviewer's exact rating and recommendation to the pull request.
4. If the rating is 2 or 3, confidence is not high, or the reviewer requests
   human approval, stop and ask the human to approve the merge.
5. Ratings 0 or 1 may merge without human approval only when checks pass and
   the review reports no blocking findings.

The implementation agent cannot review or approve its own change. The review
agent is read-only and cannot merge.

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
artifacts and references agree, product decisions are recorded where needed,
all checks pass, the work item captures validation, and the independent review
gate has been satisfied.
