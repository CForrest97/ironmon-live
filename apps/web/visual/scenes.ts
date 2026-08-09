/**
 * Deterministic IronMON Live UI states, shared by the Playwright viewport specs
 * and the visual-review capture so a state is only described once.
 *
 * `installChannelSocket` and `freezeRandomness` are stringified by
 * `page.addInitScript` and re-evaluated inside the page, so they must stay
 * self-contained and must not close over anything in this module.
 */

type Available<T> = { readonly availability: "available"; readonly value: T };
type Unavailable = { readonly availability: "unavailable" };

const available = <T>(value: T): Available<T> => ({ availability: "available", value });
const unavailable: Unavailable = { availability: "unavailable" };

const leadMember = {
  id: "1",
  name: "Bulbasaur",
  speciesId: available("1"),
  level: available(5),
  currentHp: available(12),
  maximumHp: available(20),
  types: available(["grass"]),
  status: available("healthy"),
  ability: unavailable,
  heldItem: unavailable,
  moves: available([{ id: "tackle", name: "Tackle", pp: available(35) }]),
  stats: available({ hp: 20 }),
  baseStats: available({ hp: 20 }),
  statStages: available({ atk: 0 }),
  ivs: available({ hp: 0 }),
  evs: available({ hp: 0 }),
  nature: unavailable,
  experience: available(0),
  friendship: available(0),
  gender: unavailable,
  shiny: available(false),
  pokerus: available(false),
};

const partyMember = (
  id: string,
  name: string,
  speciesId: string,
  types: readonly string[],
  level: number,
  currentHp: number,
  maximumHp: number,
) => ({
  ...leadMember,
  id,
  name,
  speciesId: available(speciesId),
  types: available(types),
  level: available(level),
  currentHp: available(currentHp),
  maximumHp: available(maximumHp),
});

const trainer = (id: string, name: string, trainerClass: string, battled: boolean) => ({
  id,
  name,
  trainerClass: available(trainerClass),
  portraitId: unavailable,
  battled: available(battled),
  party: unavailable,
  battleItems: unavailable,
  doubleBattle: available(false),
});

/** The minimal active run asserted by the viewport specs. Changing it changes those assertions. */
export const activeRunEvent = {
  type: "active",
  snapshot: {
    kind: "snapshot",
    schemaVersion: 2,
    observedAt: "2026-08-01T10:00:00Z",
    status: "active",
    party: [leadMember],
    location: available({ name: "Route 1", mapId: unavailable }),
    battle: available({
      active: true,
      kind: "trainer",
      format: "single",
      player: [leadMember],
      opponents: [leadMember],
      trainer: unavailable,
      outcome: available("in_progress"),
    }),
    route: available({ name: "Route 1", trainers: [], completed: 0, total: 0 }),
    progress: available({
      romName: unavailable,
      gameCode: unavailable,
      trackerVersion: unavailable,
      timer: unavailable,
      paused: available(false),
      playtime: unavailable,
      badges: available([]),
      centreHeals: available(0),
      wildBattles: available(0),
      trainerBattles: available(0),
      fishing: available(0),
      rockSmash: available(0),
    }),
  },
};

/** An active run with no party yet, which surfaces the starter-ball prompt. */
export const emptyPartyEvent = {
  ...activeRunEvent,
  snapshot: {
    ...activeRunEvent.snapshot,
    party: [],
    battle: available({ active: false }),
  },
};

/**
 * A mid-run state with a full party, a populated route, and real counters. Not
 * asserted by the specs; it exists so layout review sees the dense case rather
 * than the sparse one.
 */
export const fullPartyEvent = {
  type: "active",
  snapshot: {
    ...activeRunEvent.snapshot,
    party: [
      partyMember("1", "Ivysaur", "2", ["grass", "poison"], 24, 61, 74),
      partyMember("2", "Pidgeotto", "17", ["normal", "flying"], 22, 58, 66),
      partyMember("3", "Kadabra", "64", ["psychic"], 21, 12, 52),
      partyMember("4", "Growlithe", "58", ["fire"], 20, 55, 61),
      partyMember("5", "Onix", "95", ["rock", "ground"], 19, 47, 49),
      partyMember("6", "Nidorino", "33", ["poison"], 18, 44, 57),
    ],
    location: available({ name: "Rock Tunnel", mapId: available("82") }),
    battle: available({
      active: true,
      kind: "trainer",
      format: "single",
      player: [partyMember("1", "Ivysaur", "2", ["grass", "poison"], 24, 61, 74)],
      opponents: [partyMember("7", "Machop", "66", ["fighting"], 23, 39, 63)],
      trainer: available(trainer("hiker-1", "Hiker Franklin", "Hiker", false)),
      outcome: available("in_progress"),
    }),
    route: available({
      name: "Rock Tunnel",
      trainers: [
        trainer("t1", "Pokemaniac Ashton", "Pokemaniac", true),
        trainer("t2", "Hiker Lenny", "Hiker", true),
        trainer("t3", "Jr. Trainer Dana", "Jr. Trainer", true),
        trainer("t4", "Hiker Franklin", "Hiker", false),
        trainer("t5", "Pokemaniac Winston", "Pokemaniac", false),
      ],
      completed: 3,
      total: 5,
    }),
    progress: available({
      romName: available("Pokemon FireRed"),
      gameCode: available("BPRE"),
      trackerVersion: available("8.5.1"),
      timer: available("01:42:18"),
      paused: available(false),
      playtime: available("1h 42m"),
      badges: available(["Boulder", "Cascade"]),
      centreHeals: available(7),
      wildBattles: available(64),
      trainerBattles: available(19),
      fishing: available(2),
      rockSmash: available(4),
    }),
  },
};

const previewChannel = (code: string, lead: string, speciesId: string, location: string) => ({
  code,
  preview: {
    lead: available({ name: lead, speciesId: available(speciesId) }),
    location: available(location),
    game: available("Pokemon FireRed"),
  },
});

export const activeChannelsFixture = {
  channels: [
    previewChannel("00042", "Ivysaur", "2", "Rock Tunnel"),
    previewChannel("01337", "Charmeleon", "5", "Mt. Moon"),
    previewChannel("07777", "Squirtle", "7", "Viridian Forest"),
  ],
};

export const companionReleaseFixture = { version: "0.1.19" };

/**
 * Replaces `WebSocket` with a fixture that replays one channel event. It keeps
 * republishing so the channel view's staleness banner (8s without traffic)
 * cannot appear part-way through a capture and make screenshots disagree.
 */
export const installChannelSocket = (channelEvent: unknown) => {
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
  readonly channelEvent?: unknown;
  readonly activeChannels?: unknown;
  readonly companionRelease?: unknown;
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
    title: "Channel mid-run with a full party",
    path: "/channel/00042",
    intent:
      "Follow a run in progress at a glance: what is alive, what is being fought, and how far the route has gone.",
    ready: '[aria-label="Run overview"]',
    channelEvent: fullPartyEvent,
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
