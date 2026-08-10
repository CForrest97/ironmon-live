/**
 * Deterministic IronMON Live UI states, shared by the Playwright viewport specs
 * and the visual-review capture so a state is only described once.
 *
 * To change what the review sees: edit `fixtures.json` — that's the single
 * source of the raw data (party members, trainers, route, progress counters).
 * `capturedRunEvent` there is a real Tracker snapshot, not invented data, so
 * prefer replacing it with another real capture over hand-editing it. Add a
 * new `Scene` to the `scenes` array at the bottom to review a state that
 * isn't covered yet.
 *
 * Every fixture is validated against `@ironmon-live/contracts` — the same
 * parser the app runs on real WebSocket/fetch traffic — via `assertValid*`
 * below. That's what catches a fixture that drifts from the real contract:
 * a `fixtures.json` edit that the app's own parser would reject at runtime
 * (an empty string where one isn't allowed, a typo'd field name) fails here,
 * at import time, instead of showing up as a silent rendering difference in
 * a screenshot.
 *
 * `installChannelSocket` and `freezeRandomness` are stringified by
 * `page.addInitScript` and re-evaluated inside the page, so they must stay
 * self-contained and must not close over anything in this module.
 */

import {
  parseActiveChannels,
  parseChannelEvent,
  type ActiveChannelsResponse,
  type ChannelEvent,
} from "@ironmon-live/contracts";
import rawFixtures from "./fixtures.json" with { type: "json" };

const assertValidEvent = (name: string, event: unknown): ChannelEvent => {
  try {
    return parseChannelEvent(JSON.parse(JSON.stringify(event)) as unknown);
  } catch (error) {
    throw new Error(
      `fixture "${name}" does not match the ChannelEvent contract: ${String(error)}`,
      {
        cause: error,
      },
    );
  }
};

const assertValidChannels = (name: string, channels: unknown): ActiveChannelsResponse => {
  try {
    return parseActiveChannels(JSON.parse(JSON.stringify(channels)) as unknown);
  } catch (error) {
    throw new Error(
      `fixture "${name}" does not match the ActiveChannelsResponse contract: ${String(error)}`,
      { cause: error },
    );
  }
};

/** `/download` fetches this from a CDN JSON endpoint, not the Tracker contract. */
type CompanionReleaseFixture = { readonly version: string };

/**
 * The minimal fixture the viewport specs assert exact strings against
 * ("Route 1", a "Tackle" move). Kept deliberately separate from the realistic
 * scene fixtures below — the spec is checking behavior, not judging realism.
 */
export const activeRunEvent = assertValidEvent("testFixtureEvent", rawFixtures.testFixtureEvent);

/** A real captured Tracker snapshot — see `fixtures.json`'s `capturedRunEvent`. */
const capturedRunEvent = assertValidEvent("capturedRunEvent", rawFixtures.capturedRunEvent);
if (capturedRunEvent.type !== "active") {
  throw new Error('fixture "capturedRunEvent" must be an active-run ChannelEvent');
}

/** An active run with no party yet, which surfaces the starter-ball prompt. */
export const emptyPartyEvent = assertValidEvent("emptyPartyEvent", {
  type: "active",
  snapshot: {
    ...capturedRunEvent.snapshot,
    party: [],
    battle: { availability: "available", value: { active: false } },
  },
});

export const activeChannelsFixture = assertValidChannels(
  "activeChannels",
  rawFixtures.activeChannels,
);

export const companionReleaseFixture: CompanionReleaseFixture = rawFixtures.companionRelease;

/**
 * Replaces `WebSocket` with a fixture that replays one channel event. It keeps
 * republishing so the channel view's staleness banner (8s without traffic)
 * cannot appear part-way through a capture and make screenshots disagree.
 */
export const installChannelSocket = (channelEvent: ChannelEvent) => {
  class FixtureSocket extends EventTarget {
    constructor() {
      super();
      const publish = () => {
        this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(channelEvent) }));
      };
      window.setTimeout(() => {
        this.dispatchEvent(new Event("open"));
        publish();
      }, 0);
      window.setInterval(publish, 3000);
    }

    close() {
      this.dispatchEvent(new Event("close"));
    }
  }
  Object.assign(window, { WebSocket: FixtureSocket });
};

/**
 * Pins `Math.random` so randomised presentation — the starter-ball highlight —
 * lands in the same place on every capture and screenshots stay comparable.
 */
export const freezeRandomness = () => {
  let seed = 0x2f6e2b1;
  Math.random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let value = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

export type Scene = {
  /** Stable identifier; also the screenshot filename prefix. */
  readonly name: string;
  readonly title: string;
  readonly path: string;
  /** What a viewer came to this scene to do. The reviewer judges the fold against this. */
  readonly intent: string;
  /** Selector awaited before capture, so screenshots never catch a half-rendered page. */
  readonly ready: string;
  readonly channelEvent?: ChannelEvent;
  readonly activeChannels?: ActiveChannelsResponse;
  readonly companionRelease?: CompanionReleaseFixture;
};

export const scenes: readonly Scene[] = [
  {
    name: "home-active-channels",
    title: "Home with live channels",
    path: "/",
    intent:
      "Understand what IronMON Live is, join a run by code, or pick one of the channels that is live now.",
    ready: ".active-channels",
    activeChannels: activeChannelsFixture,
  },
  {
    name: "home-no-channels",
    title: "Home with nothing live",
    path: "/",
    intent:
      "Understand what IronMON Live is and enter a channel code when nothing is broadcasting.",
    ready: ".entry",
    activeChannels: { channels: [] },
  },
  {
    name: "channel-mid-run",
    title: "Channel with a live run",
    path: "/channel/00042",
    intent:
      "Follow a run in progress at a glance: what is alive, what is being fought, and how far the route has gone.",
    ready: '[aria-label="Run overview"]',
    channelEvent: capturedRunEvent,
  },
  {
    name: "channel-active-battle",
    title: "Channel during an active battle",
    path: "/channel/00042",
    intent:
      "Follow an active battle at a glance: identify the combatants, their readiness, and the route context.",
    ready: '[aria-label="Current focus"]',
    channelEvent: activeRunEvent,
  },
  {
    name: "channel-run-start",
    title: "Channel at run start",
    path: "/channel/00042",
    intent: "Watch a run that has just begun, before a starter has been chosen.",
    ready: ".starter-pick",
    channelEvent: emptyPartyEvent,
  },
  {
    name: "setup",
    title: "Companion setup",
    path: "/setup",
    intent: "Follow the steps to connect the companion to a Tracker session.",
    ready: "main",
  },
  {
    name: "download",
    title: "Companion download",
    path: "/download",
    intent: "Decide this is the right download and get the correct build for this machine.",
    ready: "main",
    companionRelease: companionReleaseFixture,
  },
];
