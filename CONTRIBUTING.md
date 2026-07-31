# Contributing

IronMON Live uses product documents, strategic DDD artifacts, and decision
records as versioned source material. Work is managed entirely through Markdown
files under `work/items`; GitHub Issues are disabled.

## Workflow

1. Create or select a `WORK-###` Markdown work item.
2. Create a focused branch from `main`.
3. Add or update the relevant governed artifact using its template.
4. Record durable product or domain trade-offs as a decision. Repository and
   tooling conventions belong in agent guidance, checks, or work-item history.
5. Fold reusable feedback into the concise learned rules in `AGENTS.md` and add
   a mechanical prevention check when useful.
6. Run `npm ci` after dependency changes and `npm run check` before opening a
   pull request.
7. Complete the pull request template and link the work item and artifacts.

Use squash merging. Direct changes to `main` are intentionally disallowed by
the repository ruleset.

## Governed artifacts

| Artifact | Filename | Lifecycle |
| --- | --- | --- |
| Product specification | `PRD-###-short-name.md` | `draft`, `accepted`, `superseded` |
| Bounded context | `CTX-###-short-name.md` | `draft`, `active`, `retired` |
| Decision record | `DEC-###-short-name.md` | `proposed`, `accepted`, `rejected`, `superseded` |

IDs are never reused. Superseded and retired artifacts remain in the
repository so their history and inbound links stay meaningful.

## Discovery notes

Discovery notes use `YYYY-MM-DD-short-name.md` and the discovery template.
They may contain raw observations and uncertainty. Link evidence from a product
specification rather than promoting a note itself to authoritative status.

## Pull requests

Keep changes narrow enough to review coherently. Before merge, a separate
read-only agent must use the repository review skill to rate the change. A
rating of 2 or 3, uncertain evidence, or an explicit reviewer recommendation
requires human approval. All conversations must be resolved and `quality` must
pass.
