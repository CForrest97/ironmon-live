---
id: WORK-016
title: Bound route progress to the reported trainer total
status: in-progress
kind: product
artifacts:
  - PRD-003
  - DEC-006
---

# Bound route progress to the reported trainer total

## Intent

Prevent the live channel from showing trainer-progress markers or trainer rows
that contradict the Tracker's reported current-route total.

## Outcome

When a route reports `total: 0`, its overview and Route panel show no trainer
markers or unbattled trainer rows, even if stale or inconsistent trainer-list
data arrives alongside the zero total. More generally, the UI shows no more
trainers than the reported total.

## Context

The maintainer supplied an active schema-version-2 snapshot for Route 101 with
`trainers: []`, `completed: 0`, and `total: 0`, alongside a viewer screenshot
that showed many unbattled trainer markers below `0/0 trainers`.
[PRD-003](../../docs/product/specs/PRD-003-expand-player-first-live-channel.md)
and [DEC-006](../../docs/decisions/DEC-006-bound-route-display-to-reported-trainer-total.md)
now define a reported total as the presentation bound when it conflicts with a
trainer list.

## Scope

Bound only the web presentation of route trainers to the reported non-negative
total. Do not alter the Tracker extension, contracts, companion, Worker,
published snapshot, or live-delivery protocol.

## Acceptance Criteria

- A route with `total: 0` renders zero route-progress markers and zero trainer
  rows in both the overview and Route panel.
- A route never renders more trainer-progress markers or rows than its reported
  total.
- Existing reported route rendering and 640 CSS-pixel layout coverage remain
  valid.

## Plan

Use one shared presentation helper to limit the reported trainer array before
constructing progress steps or Route-panel rows. Add a component regression
fixture with a non-empty trainer list paired with `total: 0` to cover the
inconsistent-state boundary observed in the screenshot.

## Validation

- `npm test` passes, including the new component regression and the 640
  CSS-pixel browser assertion that a `0/0` route renders zero markers.
- `npm run check:types`, `npm run lint:ts`, `npm run lint:markdown`,
  `npm run format:check`, and `npm run validate:workflows` pass.
- `npm run validate:docs` and `npm run check` reach only the pre-existing
  untracked `WORK-014` omission from `work/items/README.md`; this item leaves
  that unrelated work untouched.
- Final product-fit review: `aligned`, high confidence, no blocking findings.
- Initial domain-consistency review found one blocking finding: the precedence
  between two conflicting reported route values was undocumented. DEC-006
  resolves that presentation boundary; final review: `consistent`, high
  confidence, no blocking findings.
- Initial merge-risk review: rating 1, high confidence, no blocking findings
  and no human approval required for this incremental fix. The final
  merge-risk review found no blocking findings and rated the documented product
  rule 2 with high confidence, so human approval is required before merge.

## Agent Notes

The supplied JSON itself contains an empty trainer list, so it cannot generate
markers in the current mapping code. The guard protects the viewer from a
conflicting list arriving with an authoritative zero total without inventing
trainer state. A review identified this display precedence as an undocumented
product rule; DEC-006 records it before the change is merged.
