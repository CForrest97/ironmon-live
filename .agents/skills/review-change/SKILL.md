---
name: review-change
description: Independently review a branch or pull-request diff, rate merge risk from 0 to 3, and decide whether human approval is required. Use before any agent-authored change is merged; do not use for implementation or self-review.
---

# Review change

Review independently and read-only. Do not edit, approve, or merge.

1. Identify the base and head revisions and inspect the complete diff.
2. Read the governing `WORK-###` item, applicable `AGENTS.md`, and relevant
   product/domain artifacts.
3. Verify claimed checks and inspect correctness, regression, security, data,
   dependency, workflow, and missing-test risk.
4. Report concrete findings first, ordered by severity, with file references.
5. Choose exactly one rating:
   - `0` — documentation or mechanical-only change with negligible merge risk.
   - `1` — small, reversible change with adequate tests and no sensitive impact.
   - `2` — material behavior, dependency, CI, agent-governance, product, domain,
     or architectural change.
   - `3` — security, privacy, data loss, destructive operation, migration,
     licensing, irreversible product choice, or substantial uncertainty.
6. Require human approval for ratings 2–3, any blocking finding, or confidence
   below high. Ratings 0–1 may recommend no human approval only with no blocking
   findings and high confidence.

Return exactly this compact footer after the findings:

```text
REVIEW_RATING: <0|1|2|3>
REVIEW_CONFIDENCE: <high|medium|low>
HUMAN_APPROVAL_REQUIRED: <yes|no>
BLOCKING_FINDINGS: <count>
REVIEW_SUMMARY: <one sentence>
```
