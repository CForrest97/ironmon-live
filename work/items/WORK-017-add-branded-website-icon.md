---
id: WORK-017
title: Add the branded website icon
status: in-progress
kind: repository
artifacts: []
---

# Add the branded website icon

## Intent

Make the IronMON Live website recognisable in browser tabs and saved shortcuts
by using the existing branded companion artwork.

## Outcome

The website declares a favicon and Apple touch icon that browsers can load from
its public assets.

## Context

The repository already includes branded PNG icons for the native companion.
This change reuses those assets for the website without creating new product or
domain behavior.

## Scope

Add web-public copies of the existing 32px and high-resolution PNG icons and
reference them in the web document head. It excludes creating new artwork,
adding a web app manifest, and changing companion packaging.

## Acceptance Criteria

- The web document head declares a 32px PNG favicon.
- The web document head declares an Apple touch icon.
- Both declared assets are emitted by the web production build.

## Plan

Copy the existing companion PNG assets into the web app's public directory and
add the standard link tags to its Vite HTML entry point.

## Validation

- The web production build succeeds and emits both declared icon files.
- `git diff --check` passes.
- `npm run check` passes Markdown formatting, TypeScript linting and type
  checks, then stops in documentation validation because the pre-existing,
  untracked `WORK-014` is not listed in `work/items/README.md`. This work item
  leaves that unrelated user-owned change untouched.

## Agent Notes

The high-resolution existing PNG is used for the Apple touch icon because the
repository has no dedicated 180px variant.
