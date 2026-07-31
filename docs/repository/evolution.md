# Repository evolution

Start with the smallest useful agent and quality controls. Add sophistication in
response to observed failures, not anticipated fashion.

## Learning system

Reusable mistakes and corrections are recorded as versioned
[learning records](learnings/README.md). Work items capture local observations;
learning records preserve only lessons that should change future agent behavior.

## Escalation triggers

| Signal | Required response |
| --- | --- |
| A mistake reveals a reusable cause | Create or update a learning record and one prevention mechanism. |
| The same agent mistake occurs twice | Strengthen guidance with a validator, regression test, or evaluation fixture. |
| The same manual check is missed twice | Automate it in the required quality workflow. |
| An application stack is accepted | Add build, test, static analysis, dependency review, and code scanning appropriate to that stack. |
| Bounded contexts appear in code | Add architecture tests that enforce allowed dependencies. |
| A second regular maintainer joins | Add CODEOWNERS and require one approval. |
| Agent regressions recur despite written guidance | Add a small fixture-based agent evaluation suite. |

When a trigger fires, add a decision record if the response creates a durable
trade-off or changes repository policy.
