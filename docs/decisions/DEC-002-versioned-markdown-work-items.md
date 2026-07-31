---
id: DEC-002
title: Manage work as versioned Markdown
status: accepted
category: technical
supersedes: []
---

# Manage work as versioned Markdown

## Context

Product, domain, and agent context already live in the repository. Managing work
through GitHub Issues would split context across systems and make an agent's
working memory less portable.

## Decision

Manage normal work as `WORK-###` Markdown files in the repository. Disable
GitHub Issues. Pull requests link the work item that governs the change.
Security reports continue to use GitHub's private vulnerability-reporting path
because they must not be committed publicly.

## Consequences

Work-item changes are versioned, locally searchable, available to agents, and
validated with the rest of the repository. Updating work state requires a
repository change, and contributors cannot use issue-native boards or queries.

## Alternatives

GitHub Issues and a hybrid issue/document workflow were rejected because both
would create a second work-item source of truth.

## Supersedes

None.

## Open Questions

None.
