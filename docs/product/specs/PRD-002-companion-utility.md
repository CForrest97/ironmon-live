---
id: PRD-002
title: Make local publishing a quiet, trustworthy utility
status: draft
contexts: []
decisions:
  - DEC-001
---

# Make local publishing a quiet, trustworthy utility

## 1. Executive Summary

IronMON Live needs a local bridge because the website cannot continuously and
reliably observe Tracker state on the player's computer without a local
capability. The right v1 is not a second desktop product: it is a small,
macOS-first menu-bar utility that confirms whether the supported Tracker
integration is ready, publishes the latest valid run state, and gives concise,
actionable recovery guidance.

The recommended responsibility split is deliberate:

- The Lua Tracker extension understands the game and converts Tracker-observed
  facts into the canonical run-state contract.
- The companion supervises that local signal, validates it, publishes it,
  represents health honestly, and keeps local preferences.
- The website owns the player and viewer experience, live run presentation,
  channel behavior, and any future account experience.

The companion should publish on meaningful changes and send a periodic
heartbeat. It should retain only the latest valid unsent state during a network
failure, resume automatically, and avoid replaying stale intermediate states.
It should not claim that an open emulator means publishing works.

The simplest valuable alternative would be to polish the existing command-line
companion and installer. That could validate the data path cheaply, but it does
not meet the stated non-technical-user and background-confidence outcomes. A
minimal menu-bar shell earns its additional scope only if onboarding and
recovery testing show a material reduction in setup failures.

This specification remains draft because supported-version evidence, measured
operating conditions, and direct player validation are unresolved.

## 2. Product Vision

Once installed, the companion quietly makes Tracker-observable run state
available on IronMON Live. A player should normally see one reassuring status
in the menu bar, use the website for run information, and forget that the
companion exists.

“Native utility” primarily describes the interaction quality:
fast launch, familiar menu-bar behavior, restrained notifications, clear
system-permission requests, accessible controls, and no unnecessary main
window. Delivery uses a Tauri 2 shell with TypeScript-owned product logic;
Tauri's generated Rust host contains no custom product behavior.

### V1 delivery decisions

- Support macOS 13 and later with separate Apple Silicon and Intel downloads.
- Distribute non-notarized DMGs from `downloads.live.craigforrest.co.uk`
  through Cloudflare R2 and explain the additional macOS approval step.
- Keep the accountless five-digit publishing model from DEC-001; authentication
  and secure publisher ownership remain out of scope.
- Install the bundled Lua extension only into a folder selected by the player.
- Offer prompted, signed in-app updates and never force an update during play.
- Keep all browser-facing behavior in `apps/web` and all companion-local product
  behavior in `apps/companion`.
- Use focused TypeScript unit and component tests; automated companion
  integration and end-to-end tests are not required for v1.

## 3. Success Metrics

These are proposed validation targets, not established user evidence.

| Metric | v1 target | Why it matters |
| --- | --- | --- |
| First-run activation | At least 80% of representative new users reach “Live” without documentation or developer help | Tests whether onboarding is genuinely low friction |
| Time to first live state | Median under 3 minutes from launching the installer in a supported, prepared setup | Measures the whole activation experience rather than app launch speed |
| Publishing reliability | At least 99% of supported play minutes show “Live” or recover automatically without user action | Measures the “just works” promise |
| Recovery | At least 95% of tested transient network and emulator/Tracker interruptions recover without restarting the companion | Tests resilience |
| Update latency | Retain PRD-001's target: at least 95% of representative changes reach an already-open live view within one second under recorded supported conditions | Protects the live-view outcome |
| Status comprehension | At least 90% of test participants correctly identify whether they are live and the next action for a simulated failure | Prevents reassuring but meaningless status UI |
| Intrusiveness | No more than one unsolicited notification per incident, with no notification for normal successful operation | Keeps the utility quiet |

Crash-free rate and resource use should be measured, but numeric release gates
remain open until representative hardware and sessions are defined.

## 4. Target Users

The primary target remains a player actively undertaking an IronMON challenge
with the IronMON Tracker on mGBA. The utility specifically serves players who
want live publishing but should not need to understand files, scripts, ports,
or command-line processes.

Friends and spectators are affected indirectly, but they use the website and
are not companion users. Broader emulator, Tracker, game, and platform support
is not established by this specification.

## 5. User Personas

Personas below are hypothesis-based archetypes for design review, not claims
that research has validated distinct segments.

### The focused runner

Runs long challenge sessions, already uses the Tracker, and wants reliable
party and route information without another window competing for attention.
Their key need is confidence that current state is live.

### The non-technical sharer

Can install an application and follow clear prompts but does not want to locate
configuration files or diagnose integrations. Their key need is guided setup
and plain-language recovery.

### The returning player

Has already configured the utility and expects it to resume across later play
sessions and runs. Their key need is stable preferences and automatic recovery
without repeating onboarding.

## 6. User Stories

- As a first-time player, I want the companion to tell me exactly what is
  missing so that I can become live without learning its internals.
- As a player starting a run, I want publishing to begin automatically when
  valid Tracker state appears so that I do not forget a separate “go live” step.
- As a player, I want one glance at the menu bar to tell me whether viewers are
  receiving current information.
- As a player, I want to open my live website from the companion so that I can
  verify or share it easily.
- As a player, I want temporary failures to heal on their own so that I can
  stay focused on the game.
- As a player, I want warnings to be specific and restrained so that I am not
  interrupted by harmless state changes.
- As a returning player, I want my existing live channel and preferences to be
  reused so that later sessions require no setup.
- As a privacy-conscious player, I want the product to state honestly who can
  view my channel and when publishing occurs.

## 7. Primary User Flows

### 7.1 Install and first run

1. The player obtains the current macOS download from the official IronMON
   Live website; the file is delivered from a Cloudflare-hosted object bucket.
2. The player installs and opens the companion using familiar macOS behavior.
3. The companion briefly explains that it publishes Tracker-observable run
   state to a guessable, unauthenticated channel under current product policy.
4. It checks for a valid supported Tracker signal and classifies the setup as
   ready, waiting, unsupported, or needing action.
5. If action is needed, the player sees one primary action and concise guidance,
   including how to install or enable the Lua extension.
6. When valid state appears, publishing begins without another start action.
7. The companion shows “Live” and offers “Open live view” and “Copy channel
   code.” Optional start-at-login is offered without coercion.

The “magical” moment is not an animated setup wizard; it is transitioning from
installation to an accurately named “Live” state with no manual path entry or
network configuration.

### 7.2 Normal returning session

1. The companion is already running or starts at login.
2. Before a valid Tracker signal, it remains quietly in “Waiting for Tracker.”
3. When play begins and valid state appears, it resumes publishing to the
   retained channel automatically.
4. The menu-bar status changes to “Live”; no success notification is sent.

### 7.3 Recover from a local integration problem

1. The companion detects that state is missing, invalid, or unsupported.
2. It stops claiming that the run is live and preserves the last known valid
   state only as required for transient recovery.
3. The menu shows the specific condition and one recommended next action.
4. Once valid current state returns, publishing resumes automatically.

### 7.4 Recover from internet loss

1. The companion changes to “Offline—will retry” after a confirmed publishing
   failure and sends at most one useful notification.
2. It continues accepting valid local changes but retains only the latest one
   for publication.
3. It retries quietly with increasing intervals while remaining responsive.
4. On reconnection, it publishes the latest valid current state and heartbeat,
   then returns to “Live” without replaying intermediate history.

## 8. Functional Requirements

### Setup, lifecycle, and status

| ID | Requirement | Priority | User value | Rationale |
| --- | --- | --- | --- | --- |
| CU-FR-01 | The companion shall be usable entirely from the macOS menu bar after first launch and shall not require a persistent large window. | Must | Keeps attention on the game and website. | The local product is operational support, not the run-viewing destination. |
| CU-FR-02 | The companion shall provide a small settings and troubleshooting surface. | Must | Makes infrequent configuration and recovery discoverable. | A menu alone is too constrained for clear setup guidance. |
| CU-FR-03 | The companion shall offer an opt-in start-at-login setting that can be changed later. | Should | Removes repeated launch effort without surprising the player. | Automatic launch helps returning users but should remain user-controlled. |
| CU-FR-04 | On first run, the companion shall explain automatic publishing and the current channel visibility model before publishing begins. | Must | Prevents accidental sharing and false privacy expectations. | PRD-001 and DEC-001 define immediate publishing through a guessable code. |
| CU-FR-05 | The companion shall reuse the locally retained channel code across launches and runs. | Must | Gives the player and friends a stable destination. | This preserves PRD-001's existing product behavior. |
| CU-FR-06 | The companion shall offer actions to open the live website and copy the channel code. | Must | Makes verification and sharing easy. | These are the only routine transitions the player needs from utility to product. |
| CU-FR-07 | Uninstall, reset, or replacement-device channel recovery shall not be implied unless it is actually supported. | Must | Avoids unexpected loss or false recovery promises. | Accountless local identity is not inherently portable. |

### Local readiness and responsibility boundary

| ID | Requirement | Priority | User value | Rationale |
| --- | --- | --- | --- | --- |
| CU-FR-08 | The companion shall determine readiness from a valid supported Tracker integration signal, not solely from the presence of an emulator process. | Must | Status reflects whether publishing can work. | Process detection alone creates false positives and platform coupling. |
| CU-FR-09 | The companion may present emulator presence as secondary diagnostic context only when it is reliable and actionable. | Could | Can shorten troubleshooting in some supported setups. | It is helpful enrichment, not proof of connection. |
| CU-FR-10 | Game-aware reading, interpretation, and normalization shall remain the Lua Tracker extension's responsibility. | Must | Keeps reported facts consistent with the Tracker. | The extension is closest to the game semantics; duplicating them invites disagreement. |
| CU-FR-11 | The companion shall validate incoming state and shall never publish malformed, unsupported, or stale state as current. | Must | Protects viewers from misleading information. | Trust is more important than appearing connected. |
| CU-FR-12 | The website shall remain the only initial surface for party, route, and live-run presentation. | Must | Gives players one information experience. | Duplicating the run view expands scope and creates competing products. |
| CU-FR-13 | The companion shall classify its state using a small, mutually exclusive set: Setup required, Waiting for Tracker, Live, Offline—retrying, Unsupported, and Action required. | Must | Makes health understandable at a glance. | A generic connected/disconnected indicator cannot explain the next action. |
| CU-FR-14 | Every non-live state shall provide a plain-language explanation and, when action is possible, one recommended next action. | Must | Enables self-recovery for non-technical users. | Raw errors and multiple equal choices create avoidable support burden. |

### Publishing and recovery

| ID | Requirement | Priority | User value | Rationale |
| --- | --- | --- | --- | --- |
| CU-FR-15 | The companion shall publish each meaningful valid state change promptly and shall send a periodic heartbeat while valid state remains available. | Must | Keeps the view current and liveness accurate. | A hybrid model meets freshness needs without constant full-state polling. |
| CU-FR-16 | The companion shall suppress redundant state publications while still maintaining the heartbeat required by PRD-001. | Should | Reduces unnecessary work without making the run appear inactive. | Run state is replacement state, not an audit log. |
| CU-FR-17 | During a network outage, the companion shall retain only the latest valid current state needed to resume. | Must | Returns viewers to the truth quickly after reconnection. | Replaying intermediate changes adds delay and falsely suggests history is meaningful. |
| CU-FR-18 | The companion shall retry transient publication failures automatically with restrained, increasing intervals. | Must | Avoids requiring a restart during ordinary outages. | Automatic recovery is central to the background-utility promise. |
| CU-FR-19 | After connectivity returns, the companion shall publish the latest valid state and resume normal heartbeats without user action. | Must | Restores live viewing with no gameplay interruption. | This is the desired steady-state recovery behavior. |
| CU-FR-20 | When the emulator, Tracker, or Lua signal closes normally, the companion shall enter Waiting for Tracker and cease heartbeats; it shall not exit by default. | Must | It is ready for the next session without showing a false “Live.” | A resident utility should outlive individual emulator sessions. |
| CU-FR-21 | Website state after local shutdown shall continue to follow PRD-001's heartbeat-expiry policy unless a separate product decision changes it. | Must | Preserves consistent remote behavior. | The current draft retains terminal/current state until expiry; the companion must not redefine it accidentally. |
| CU-FR-22 | The companion shall not replay a state that predates the current Tracker publishing session after the local source restarts. | Must | Prevents an old run appearing as current. | Local persistence must not turn ephemeral state into history. |
| CU-FR-23 | The player shall be able to pause and resume publishing explicitly. | Should | Gives immediate control when they do not want to share. | Current immediate-publishing policy may surprise users; a pause is a reversible safety control. |
| CU-FR-24 | Normal operation shall be silent; the companion shall notify only when timely player action is likely to prevent or end a material publishing interruption. | Must | Avoids distraction and alert fatigue. | Status belongs in the menu bar unless interruption adds value. |
| CU-FR-25 | Repeated symptoms from one unresolved incident shall produce at most one unsolicited notification until the state materially changes. | Must | Keeps retries from becoming disruptive. | Background retry loops must not leak into the user's attention. |

### Authentication and distribution

| ID | Requirement | Priority | User value | Rationale |
| --- | --- | --- | --- | --- |
| CU-FR-26 | V1 shall not describe the five-digit channel code as authentication, privacy, or proof of publisher ownership. | Must | Sets truthful expectations about sharing and collisions. | DEC-001 explicitly treats the code as an identifier. |
| CU-FR-27 | V1 shall not introduce account sign-in or a private publishing credential. | Must | Preserves immediate, accountless setup. | The maintainer selected the existing DEC-001 trade-off for this release. |
| CU-FR-28 | If authentication is later required, the companion shall guide the flow but the website shall own account creation, account recovery, consent, and identity management. | Should | Keeps identity tasks in the primary product and available recovery surface. | A tiny utility is a poor home for a full identity lifecycle. |
| CU-FR-29 | The official website shall provide the macOS download, with the binary artifact served from a Cloudflare-hosted object bucket. | Must | Gives users one trusted place to obtain the utility. | This is an explicit distribution constraint; the bucket should not become a separate discovery surface. |
| CU-FR-30 | The download experience shall identify the version, supported environment, checksum, lack of Developer ID signing/notarization, resulting installation steps, and release notes before installation. | Must | Helps users judge trust, friction, and compatibility. | Object hosting alone does not establish authenticity or suitability. |
| CU-FR-31 | The companion should alert the player when an important compatible update is available and direct them to a trusted update path. | Should | Keeps compatibility and reliability fixes accessible. | Silent forced updates add risk; no update signal leaves users stranded. |
| CU-FR-32 | Automatic background updating may be added only after update consent, rollback, integrity, and failure behavior are decided. | Could | Could reduce maintenance effort later. | It is valuable but expands the security and recovery surface beyond excellent v1 scope. |

## 9. Non-functional Requirements

| ID | Requirement | Priority | User value | Rationale |
| --- | --- | --- | --- | --- |
| CU-NFR-01 | The companion shall preserve PRD-001's measured end-to-end latency criterion under explicitly recorded supported conditions. | Must | Makes the website feel live. | Local speed alone is not the user outcome. |
| CU-NFR-02 | The companion shall remain responsive and unobtrusive throughout representative multi-hour play sessions. | Must | Avoids disrupting the emulator or play. | Long-running background use is the normal case. |
| CU-NFR-03 | CPU, memory, energy, network, and disk budgets shall be measured on representative supported hardware before release gates are accepted. | Must | Protects game performance and battery life. | Numeric limits without a reference setup would be invented precision. |
| CU-NFR-04 | The companion shall recover safely after its own restart or an operating-system restart without publishing persisted stale run state. | Must | Makes start-at-login trustworthy. | Resilience must not violate ephemeral-state semantics. |
| CU-NFR-05 | Status text, actions, keyboard navigation, focus order, contrast, and assistive-technology labels shall support applicable macOS accessibility expectations. | Must | Keeps setup and recovery usable by more players. | Utility-sized UI is not exempt from accessibility. |
| CU-NFR-06 | Player-facing diagnostics shall avoid exposing secrets or unnecessary local paths and shall explain what would be shared before any support export. | Must | Protects privacy while enabling help. | Diagnostic convenience can accidentally disclose local information. |
| CU-NFR-07 | Distribution shall publish SHA-256 checksums, use Tauri signatures for in-app updates, and state that DMGs are not Developer ID signed or notarized. | Must | Gives players honest integrity and installation expectations. | The maintainer will not pay for an Apple Developer account. |
| CU-NFR-08 | Cloudflare-hosted release artifacts shall have documented access, retention, replacement, and rollback policies before production distribution. | Must | Prevents broken or ambiguous official downloads. | Bucket location is not a release-management policy. |
| CU-NFR-09 | User-visible behavior shall use platform-neutral product language except where a step truly differs on macOS. | Should | Preserves a path to other platforms. | Avoiding unnecessary platform assumptions is an explicit goal. |
| CU-NFR-10 | Errors and state changes shall be locally diagnosable without requiring ordinary users to use a terminal. | Must | Enables non-technical recovery. | Command-line-only diagnostics contradict the target experience. |
| CU-NFR-11 | The companion shall collect no product analytics or diagnostic content by default unless scope, consent, retention, and privacy behavior are explicitly decided. | Must | Avoids unapproved data collection. | Success measurement does not itself authorize telemetry. |

## 10. Edge Cases

- Multiple emulator processes: readiness follows the valid supported Tracker
  signal; v1 does not invent automatic run selection without evidence.
- Multiple valid Tracker signals: publishing pauses in Action required unless a
  deterministic, user-understandable selection rule is established.
- Emulator open but no ROM, unsupported game, or unsupported Tracker output:
  show Waiting or Unsupported, never Live.
- Valid state arrives before first-run disclosure is completed: do not publish
  until the disclosure has been acknowledged.
- State becomes invalid after valid state: stop heartbeats and show Action
  required; do not replace truth with fabricated empty values.
- Game or Tracker closes during a network outage: discard queued state for the
  ended local publishing session and do not publish it on reconnection.
- Rapid state changes: coalesce safely to the latest full current state while
  still meeting the measured live-update target.
- Sleep, wake, and network switching: reassess both local freshness and remote
  reachability before returning to Live.
- Clock changes: liveness and stale-state decisions must not rely on a user
  clock in a way that republishes expired data.
- Channel-code collision or competing publisher: explain the current
  unauthenticated limitation; do not claim ownership or silently “fix” it.
- Reset preferences or uninstall: warn clearly if the retained channel code
  may be lost and cannot be recovered.
- Application update during a run: do not force an interruption; explain when
  the update will take effect.
- Cloudflare download unavailable: the website should say the download is
  temporarily unavailable rather than offer an untrusted mirror.

## 11. Failure & Recovery Behaviour

| Condition | Player-visible state | Automatic behavior | Player action |
| --- | --- | --- | --- |
| No valid Tracker signal yet | Waiting for Tracker | Continue observing quietly | Open setup help if unexpected |
| Supported signal is invalid or stale | Action required | Stop publishing/heartbeats; wait for valid current state | Follow one recommended correction |
| Unsupported input | Unsupported | Do not publish; preserve diagnostics | Review supported versions or setup guidance |
| Emulator/Tracker closes | Waiting for Tracker | Remain running; stop heartbeats; resume on fresh valid state | None for a normal end of play |
| Internet unavailable | Offline—retrying | Keep latest valid current state; retry with backoff | None unless the interruption persists |
| Internet returns with same active local session | Live after acknowledgement | Publish latest state once, then resume events and heartbeat | None |
| Internet returns after local session ended | Waiting for Tracker | Discard ended-session queued state | Start a supported session when ready |
| Remote rejection or incompatible companion | Action required | Stop futile retries when the failure is non-transient | Follow update or support guidance |
| Companion crashes or OS restarts | Waiting, then Live only after fresh validation | Restart if opted in; never publish stale persisted state | Reopen only if automatic launch is off |
| Competing publisher/channel collision | Action required when detectable | Do not claim ownership; avoid destructive automatic reassignment | Use documented reset/recovery choice |

The website continues to apply the current 30-minute default heartbeat expiry
from PRD-001. Whether it should show a more immediate “publisher disconnected”
state is a website policy question and should not be invented in the companion.

## 12. UX Principles

- **Truth before reassurance.** “Live” means current valid state has been
  accepted remotely, not merely that the app or emulator is open.
- **One glance, one next action.** Status is short; recovery has a single
  recommended path with detail available on demand.
- **Silence is success.** Normal transitions do not create notifications,
  windows, or repeated confirmations.
- **The website is the product surface.** The companion links to it instead of
  reproducing it.
- **Automatic within clear consent.** Setup and recovery are automated after
  the player understands that valid state publishes automatically.
- **No jargon in the critical path.** Avoid file paths, payloads, processes,
  and transport terminology unless the player opens advanced diagnostics.
- **Progressive disclosure.** Common status and actions stay small; version and
  diagnostic detail remains available without dominating the experience.
- **Platform-familiar, product-consistent.** Use familiar macOS interactions
  while keeping status concepts portable.

## 13. Assumptions

- A continuously running local component is necessary to bridge local Tracker
  state to a remote website without repeated browser interaction.
- The Lua extension can expose sufficiently fresh, complete, and trustworthy
  canonical state, but named version compatibility is not yet proven.
- Players value a menu-bar utility enough to justify more product surface than
  the existing command-line companion; this requires usability validation.
- macOS players are willing to approve an independent, non-notarized build
  through Privacy & Security after downloading from the official website.
- Event-driven changes plus heartbeat can meet the latency and liveness goals.
- The five-digit channel and immediate-publishing policy remain in force unless
  an explicit decision changes them.
- Cloudflare-hosted object delivery can meet the eventual availability and
  release-integrity requirements; this has not been validated.

## 14. Risks

- The proposed experience is based on maintainer direction, not observation of
  representative players.
- A polished wrapper may hide an unreliable Tracker integration rather than
  solve it; “Live” semantics must be end-to-end.
- Automatic publishing through a guessable channel may surprise privacy-minded
  players and permits viewing or competing publication under DEC-001.
- Adding authentication in v1 could overwhelm the bridge's value with account
  setup; omitting publisher authentication preserves known collision risk.
- Compatibility detection can become an expensive matrix of games, emulators,
  Trackers, extensions, and operating systems.
- macOS permissions, signing, security warnings, or update failures could make
  onboarding feel less trustworthy than the command-line tool.
- A permanent background process may affect game performance or battery life.
- A Cloudflare bucket can distribute files but does not by itself establish
  provenance, safe updates, rollback, or release governance.
- An over-automated recovery loop can conceal prolonged data loss unless status
  changes remain accurate and visible.

## 15. Open Questions

1. Which exact mGBA, IronMON Tracker, extension, game, and ruleset
   combinations will be tested and named as supported?
2. How should the product behave when more than one valid local run source is
   available?
3. Should explicit Pause publishing be a v1 Must given immediate publication,
   or is disclosure alone sufficient?
4. Should the website distinguish a recent disconnect from normal heartbeat
   expiry, and if so, what wording is truthful?
5. What representative hardware and session length define acceptable resource
   usage and crash-free operation?
6. What evidence would show the menu-bar application delivers more value than
    a guided installer plus the existing lightweight local companion?
7. What analytics, if any, may be collected with informed consent to measure
    activation and reliability?

## 16. Future Opportunities

- Additional operating systems after the v1 workflow is validated.
- More emulator and Tracker combinations based on measured player demand.
- A private publishing credential or account-linked channel recovery if misuse
  or device migration demonstrates the need.
- Safe automatic updates after integrity and rollback behavior is established.
- Opt-in support bundles with clear redaction and consent.
- Guided compatibility checks before download.
- Multiple local profiles only if users demonstrate a real multi-run or
  multi-install need.

These opportunities do not include expanding the companion into a run viewer;
the website remains the primary product.

## 17. Explicitly Out of Scope

- Party, route, battle, encounter, inventory, history, or spectator views in
  the companion.
- Public channel discovery, directories, social features, or chat.
- Permanent run history or retained final snapshots.
- Claims of secure or private five-digit channels under DEC-001.
- Broad compatibility promises beyond named, tested configurations.
- Automatic selection among simultaneous valid local runs without an accepted
  product rule.
- Full account creation, account recovery, or identity management inside the
  companion.
- Forced or silent automatic updates in v1.
- Mobile companion applications.
- Database-schema or remote API redesign.

## Problem

The website cannot continuously observe local Tracker state without a local
bridge, while the existing CLI does not give non-technical players the quiet,
self-explanatory setup and recovery experience described above.

## Users

Primary companion users are the players described in Target Users. Friends and
spectators remain website users.

## Desired Outcomes

Players can become live without a terminal, understand end-to-end publishing
health at a glance, and recover from ordinary interruptions without leaving the
game. The companion stays quiet while the website remains the viewing product.

## Non-goals

The items under Explicitly Out of Scope are non-goals for this specification.

## Scope

V1 is the macOS 13+ Tauri menu-bar companion, guided Lua installation, prompted
updates, separate arm64 and x86_64 downloads, website download route,
and Cloudflare R2 distribution described above.

## Requirements

The normative functional requirements are CU-FR-01 through CU-FR-32. The
normative non-functional requirements are CU-NFR-01 through CU-NFR-11.

## Acceptance Criteria

- A supported player can install the companion and Lua extension, acknowledge
  publication visibility, and reach Live without a terminal.
- Live appears only after fresh valid state has been accepted remotely.
- Pause, start at login, offline recovery, channel actions, and prompted
  cryptographically verified updates behave as specified.
- The website owns both architecture downloads from
  `downloads.live.craigforrest.co.uk` and the companion contains no run view.
- Focused TypeScript unit and component tests and release smoke checks pass;
  automated companion integration tests are not required for v1.

## Risks

The material risks are recorded in section 14.

## Open Questions

The unresolved product questions are recorded in section 15.

## Affected Contexts

None.

## Decisions

- [DEC-001: Use ephemeral, unauthenticated live channels](../../decisions/DEC-001-unauthenticated-live-channels.md)
  remains proposed. The maintainer selected its accountless trade-off for this
  v1, without representing the code as authentication or secure ownership.

## Evidence

- [Companion utility product direction](../discovery/2026-08-01-companion-utility-direction.md)
- [Initial player-companion interview and PoC review](../discovery/2026-07-31-initial-player-companion.md)
- [Product brief](../product-brief.md)
- [PRD-001: Provide an ephemeral live player companion](PRD-001-live-player-companion.md)
