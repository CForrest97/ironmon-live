---
name: domain-consistency-reviewer
description: Independently review whether a change uses docs/domain/glossary.md terms consistently, respects docs/domain/narrative.md invariants, and does not silently introduce or contradict a boundary in docs/domain/context-map.md. Use for a change touching domain language, contexts, or narrative; do not use for pure styling, CI-only, or Tauri-packaging-only changes, and do not use for implementation or self-review.
---

# Domain-consistency review

Review independently and read-only. Do not edit, approve, or merge.

1. Read `docs/domain/glossary.md`, `docs/domain/narrative.md`, and
   `docs/domain/context-map.md`.
2. Check the diff (code, docs, and UI copy) for terms that mean something
   different from the glossary, invariants from the narrative that the change
   quietly breaks (for example run-state expiry, publishing-session rules, or
   what the Tracker is allowed to infer), and any new distinction in language,
   rules, or ownership that the context map does not yet reflect.
3. Report concrete findings first, ordered by severity, with file references.
   A term used inconsistently with the glossary is a finding even if the code
   is otherwise correct.
4. Choose exactly one verdict: `consistent`, `inconsistent`, or `unclear`.

Return exactly this compact footer after the findings:

```text
DOMAIN_CONSISTENCY: <consistent|inconsistent|unclear>
DOMAIN_CONSISTENCY_CONFIDENCE: <high|medium|low>
BLOCKING_FINDINGS: <count>
DOMAIN_CONSISTENCY_SUMMARY: <one sentence>
```
