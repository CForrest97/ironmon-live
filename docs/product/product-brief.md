# Product brief

This document is the stable product backbone. Replace explicit open questions
through evidence and accepted decisions; do not guess at answers.

## Vision

IronMON Live gives people undertaking an IronMON challenge a clear, live view
of the run information they need while playing and lets others follow that run
without adding work for the player.

## Problem

Players consult an existing command-line tracker continuously during an
IronMON challenge because detailed party and route information informs their
play. The current presentation is difficult to use at a glance, and sharing a
run with friends requires taking and sending screenshots manually.

## Target users

The first target user is a player actively undertaking an IronMON challenge
with the IronMON Tracker on mGBA. Friends and other spectators who have been
given the player's live channel code are secondary users.

These users and situations come from the maintainer interview recorded in the
[initial product discovery note](discovery/2026-07-31-initial-player-companion.md);
broader user validation has not yet occurred.

## Value proposition

IronMON Live turns Tracker data into a player-first view that stays current
without manual refresh or screenshot sharing. The same ephemeral view can be
followed remotely by anyone with its code.

## Outcomes

- During play, a player can understand current party details and route-trainer
  progress at a glance.
- Changes visible to the Tracker appear in the live view within one second
  under supported operating conditions.
- A player can let another person follow the current run without repeatedly
  capturing and sending screenshots.

Product evidence has not yet established adoption, usability, or reliability
targets beyond the one-second update target supplied by the maintainer.

## Non-goals

- Searching or filtering live channels, or showing more than a bounded run
  preview per channel (see [DEC-003](../decisions/DEC-003-list-active-channels-on-homepage.md)
  and [DEC-004](../decisions/DEC-004-show-a-bounded-run-preview-on-homepage-channel-cards.md)
  for the homepage's default listing of active channels and their preview).
- Player accounts or authenticated spectator access in the initial product.
- Permanent run history or a retained final run snapshot.
- Encounter and battle guidance in the initial product.
- Inventory display or remaining route-item progress in the initial product.
- Spectator-specific presentation before the player experience is proven.

## Open questions

- Which game, ruleset, emulator, and Tracker combinations will be validated
  beyond conformance to the initial canonical Tracker schema?
- What evidence will demonstrate that the player view is materially easier to
  use than the existing command-line presentation?
- Under which supported conditions can the product reliably meet the one-second
  update target?
- When would misuse of an unauthenticated five-digit channel justify stronger
  channel ownership or access controls?
