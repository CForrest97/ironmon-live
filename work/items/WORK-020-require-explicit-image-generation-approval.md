---
id: WORK-020
title: Require explicit approval for image generation
status: done
kind: repository
artifacts: []
---

# Require explicit approval for image generation

## Intent

Preserve the maintainer's control over image-generation costs.

## Outcome

Repository agents do not run image-generation scripts or tools unless the
requester explicitly asks them to generate or edit an image.

## Context

The maintainer reported that the available image-generation script is
expensive and asked for the restriction to be retained as a reusable learning.

## Scope

Record an agent-operating rule only. Do not run, inspect, modify, or otherwise
exercise image-generation scripts or tools.

## Acceptance Criteria

- `AGENTS.md` requires an explicit requester instruction before image
  generation is run.
- The rule records the cost reason without naming or assuming a particular
  script.

## Plan

Add one concise learned rule and retain this work item as the feedback record.

## Validation

- Confirm the learned rule and work-item index agree.
- No image-generation script or tool was invoked.

## Agent Notes

The script's name and implementation are intentionally unspecified because the
maintainer did not identify them and the operating constraint applies without
that assumption.
