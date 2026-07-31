# Contributing

IronMON Live uses product documents, strategic DDD artifacts, and decision
records as versioned source material. Work is managed entirely through Markdown
files under `work/items`; GitHub Issues are disabled.

## Workflow

1. Create or select a `WORK-###` Markdown work item.
2. Create a focused branch from `main`.
3. Add or update the relevant governed artifact using its template.
4. Record durable product, domain, or technical trade-offs as a decision.
5. Capture reusable mistakes as learning records plus a prevention change.
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

## Agent learnings

Learning records use `LRN-###-short-name.md`. A learning must identify evidence,
root cause, correction, and a concrete prevention mechanism. Review active
learnings before beginning related work and supersede obsolete guidance rather
than deleting history.

## Pull requests

Keep changes narrow enough to review as one decision. A pull request may have
zero required approvals for solo work, but all conversations must be resolved
and the `quality` check must pass before merge.
