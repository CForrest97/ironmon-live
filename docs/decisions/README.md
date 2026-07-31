# Decision records

Decision records preserve consequential product and domain choices.
Start with [`_template.md`](_template.md) and allocate the next unused `DEC-###`
ID. Accepted records are immutable except for corrections and status changes;
replace a decision by adding a new record and linking it through `supersedes`.

Do not use decision records for repository structure, tooling preferences,
agent workflow, or CI policy.

## Index

- [DEC-001: Use ephemeral, unauthenticated live channels](DEC-001-unauthenticated-live-channels.md)
