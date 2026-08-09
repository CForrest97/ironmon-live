---
name: new-work-item
description: Scaffold a new WORK-### work item with a valid ID, filename, frontmatter, required sections, and README index placement. Use only when explicitly asked to start a work item; do not use for updating an existing one.
---

# New work item

1. List `work/items/*.md` and pick the next unused `WORK-###`.
2. Copy `work/items/_template.md` to `work/items/WORK-###-short-name.md`,
   where `short-name` is a lowercase, hyphenated slug.
3. Fill frontmatter: `id` (matching the filename), `title`, `status`
   (`backlog` unless told otherwise), `kind` (`product`, `domain`,
   `technical`, or `repository`), `artifacts` (an array of `PRD-###`,
   `CTX-###`, or `DEC-###` IDs the work is governed by, or `[]`).
4. Set the `# H1` to exactly match `title`.
5. Fill every required section — Intent, Outcome, Context, Scope, Acceptance
   Criteria, Plan, Validation, Agent Notes — with real content. Never leave
   `TBD`, `TODO`, `{{...}}`, `[fill...]`, or `replace with`.
6. If `artifacts` is non-empty, the Context section must mention every listed
   ID.
7. Add a Markdown list entry linking the new title to
   `WORK-###-short-name.md` to `work/items/README.md` under the `Active`
   section, or under `Completed` if `status` is `done` or `cancelled` — the
   validator checks the entry sits in the section matching the current
   status, so move it when status changes later.
8. Run `npm run validate:docs` (or `npm run check`) and fix any reported error
   before treating the item as scaffolded.
