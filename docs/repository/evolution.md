# Repository evolution

Start with the smallest useful agent and quality controls. Add sophistication in
response to observed failures, not anticipated fashion.

## Improvement log

For each recurring problem, record the date, symptom, examples, frequency, and
chosen response in the table below.

| Date | Symptom and evidence | Count | Response | Status |
| --- | --- | --- | --- | --- |

## Escalation triggers

| Signal | Required response |
| --- | --- |
| The same agent mistake occurs twice | Clarify `AGENTS.md` or add a focused validator rule. |
| The same manual check is missed twice | Automate it in the required quality workflow. |
| An application stack is accepted | Add build, test, static analysis, dependency review, and code scanning appropriate to that stack. |
| Bounded contexts appear in code | Add architecture tests that enforce allowed dependencies. |
| A second regular maintainer joins | Add CODEOWNERS and require one approval. |
| Agent regressions recur despite written guidance | Add a small fixture-based agent evaluation suite. |

When a trigger fires, add a decision record if the response creates a durable
trade-off or changes repository policy.
