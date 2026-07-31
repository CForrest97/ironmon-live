# Repository evolution

Start with the smallest useful agent and quality controls. Add sophistication in
response to observed failures, not anticipated fashion.

## Learning system

Reusable mistakes become concise learned-rule bullets in `AGENTS.md`, which is
loaded for every agent run. Incident detail stays in its work item. Add a test,
validator, template constraint, or review rule when prevention can be mechanical.

## Escalation triggers

| Signal | Required response |
| --- | --- |
| A mistake reveals a reusable cause | Merge a concise learned rule into `AGENTS.md` and add a prevention mechanism when useful. |
| The same agent mistake occurs twice | Strengthen guidance with a validator, regression test, or evaluation fixture. |
| The same manual check is missed twice | Automate it in the required quality workflow. |
| An application stack is accepted | Add build, test, static analysis, dependency review, and code scanning appropriate to that stack. |
| Bounded contexts appear in code | Add architecture tests that enforce allowed dependencies. |
| A second regular maintainer joins | Add CODEOWNERS and require one approval. |
| Agent regressions recur despite written guidance | Add a small fixture-based agent evaluation suite. |

Decision records remain reserved for product choices. Repository conventions
belong in `AGENTS.md`, validation, skills, or work-item history.
