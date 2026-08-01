---
id: WORK-005
title: Add the Lua Tracker extension
status: in-progress
kind: product
artifacts:
  - PRD-001
---

# Add the Lua Tracker extension

## Intent

Connect the IronMON Tracker to the existing local companion without expanding
the initial product beyond Tracker-observable party and route-trainer state.

## Outcome

A player can install a Lua Tracker extension that atomically writes canonical
version 1 messages to the companion's default input path.

## Context

- [PRD-001](../../docs/product/specs/PRD-001-live-player-companion.md)
- [MVP application stack](../../docs/repository/application-stack.md)
- [WORK-004](WORK-004-live-player-companion-mvp.md)

The maintainer supplied a proof-of-concept extension stub containing broader
data than the accepted MVP scope and a payload shape that does not match the
canonical contract.

## Scope

Adapt the supplied Lua stub into an installable Tracker extension. Export
canonical snapshot and unsupported messages containing current party details
and current-route trainer progress. Match the companion's default input path,
replace the file through a temporary file, and refresh unchanged state often
enough to maintain the publishing heartbeat. Provide one local development
command that starts the web application, Worker, and companion together.

Do not export enemy teams, battle details, inventory, encounters, badges,
notes, or aggregate game statistics. Do not claim compatibility with a
specific Tracker, game, emulator, or operating-system version until measured.

## Acceptance Criteria

- The extension writes schema-version 1 messages accepted by the companion.
- The default output is `~/.ironmon-live/tracker.json`, with the corresponding
  `%USERPROFILE%` location on Windows.
- Available party fields retain reported zero and empty values, while missing
  values are marked unavailable.
- Current-route trainers include stable non-empty IDs, names, battled
  availability, and completed and total counts.
- No-ROM and unsupported-game states produce an unsupported message rather
  than a run snapshot.
- Writes use a temporary file replacement and unchanged state is refreshed at
  least every two seconds.
- Installation and fallback-path behavior are documented.
- `npm run dev` starts the local services, waits for the web endpoint before
  launching the companion, and stops both processes on exit.
- Repository checks pass.

## Plan

Reduce the proof of concept to the canonical contract, add installation and
availability guidance, update repository navigation, and validate the emitted
message shapes and repository checks.

## Validation

`npm run check` passes Markdown linting, formatting, strict ESLint and
TypeScript checks, documentation and workflow validation, and all 22 repository
and application tests. `git diff --check` reports no whitespace errors.

`npm run dev` builds the companion, waits for the local Worker API, launches
the companion against that API, and shuts down its child processes when
interrupted. The smoke test reached the companion's expected wait for
`~/.ironmon-live/tracker.json`; live Lua output still requires the target
environment.

Execution against an installed IronMON Tracker and mGBA environment remains
pending; neither a Lua interpreter nor the target runtime is available in the
repository environment.

## Agent Notes

Assumption: the supplied `TrackerAPI`, `FileManager`, `GameSettings`, and
`GameOverScreen` calls describe the extension API available in the target
environment. This has not been validated against a named Tracker release.

Missing domain values are represented as unavailable, not fabricated. Default
strings are limited to non-domain display fallbacks required by the canonical
contract, such as `Unknown Pokemon` and `Unknown trainer`.
