import { describe, expect, it } from "vitest";
import {
  ContractError,
  derivePreview,
  isChannelCode,
  parseActiveChannels,
  parseChannelEvent,
  parseChannelPreview,
  parseTrackerMessage,
  type ExpandedRunSnapshot,
  type LegacyRunSnapshot,
} from "./index.ts";

const base = {
  kind: "snapshot",
  schemaVersion: 1,
  observedAt: "2026-07-31T12:00:00.000Z",
  status: "DEAD",
  party: [
    {
      id: "1",
      name: "Bulbasaur",
      types: { availability: "available", value: [] },
      ivs: { availability: "available", value: { hp: 0 } },
      evs: { availability: "unavailable" },
      stats: { availability: "available", value: { hp: 10 } },
      moves: { availability: "available", value: [] },
    },
  ],
  route: { availability: "unavailable" },
};

const available = <T>(value: T) => ({ availability: "available" as const, value });
const unavailable = { availability: "unavailable" as const };
const member = {
  id: "1",
  name: "Bulbasaur",
  speciesId: available("1"),
  level: available(0),
  currentHp: available(0),
  maximumHp: available(10),
  types: available([]),
  status: available("healthy"),
  ability: unavailable,
  heldItem: unavailable,
  moves: available([]),
  stats: available({ hp: 0 }),
  statStages: available({ atk: 0 }),
  ivs: available({ hp: 0 }),
  evs: unavailable,
  nature: unavailable,
  experience: available(0),
  friendship: available(0),
  gender: unavailable,
  shiny: available(false),
  pokerus: available(false),
} as const;
const expanded: ExpandedRunSnapshot = {
  kind: "snapshot",
  schemaVersion: 2,
  observedAt: "2026-08-01T12:00:00.000Z",
  status: "active",
  party: [member],
  location: available({ name: "Route 1", mapId: unavailable }),
  battle: available({ active: false }),
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
};

describe("tracker contract", () => {
  it("preserves zero and empty values as available", () => {
    expect(parseTrackerMessage(base)).toEqual(base);
  });

  it("accepts the expanded schema and preserves zero, false, and empty values", () => {
    expect(parseTrackerMessage(expanded)).toEqual(expanded);
  });

  it("rejects unknown schema versions", () => {
    expect(() => parseTrackerMessage({ ...base, schemaVersion: 3 })).toThrow(ContractError);
  });

  it("validates channel event snapshots", () => {
    expect(parseChannelEvent({ type: "active", snapshot: expanded })).toEqual({
      type: "active",
      snapshot: expanded,
    });
    expect(() =>
      parseChannelEvent({ type: "active", snapshot: { ...expanded, schemaVersion: 3 } }),
    ).toThrow(ContractError);
  });

  it("validates channel codes", () => {
    expect(isChannelCode("00001")).toBe(true);
    expect(isChannelCode("1234")).toBe(false);
  });

  it("derives a bounded preview from a legacy snapshot with no game data", () => {
    expect(derivePreview(base as LegacyRunSnapshot)).toEqual({
      lead: available({ name: "Bulbasaur", speciesId: unavailable }),
      location: unavailable,
      game: unavailable,
    });
  });

  it("falls back to the legacy route name for location", () => {
    const withRoute = {
      ...base,
      route: {
        availability: "available",
        value: { name: "Route 22", trainers: [], completed: 0, total: 0 },
      },
    } as LegacyRunSnapshot;
    expect(derivePreview(withRoute).location).toEqual(available("Route 22"));
  });

  it("derives a bounded preview from an expanded snapshot, dropping unlisted fields", () => {
    expect(derivePreview(expanded)).toEqual({
      lead: available({ name: "Bulbasaur", speciesId: available("1") }),
      location: available("Route 1"),
      game: unavailable,
    });
  });

  it("surfaces the ROM name as the game field when available", () => {
    const withGame: ExpandedRunSnapshot = {
      ...expanded,
      progress: available({
        romName: available("Pokemon FireRed"),
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
    };
    expect(derivePreview(withGame).game).toEqual(available("Pokemon FireRed"));
  });

  it("round-trips a parsed channel preview", () => {
    const preview = derivePreview(expanded);
    expect(parseChannelPreview(preview)).toEqual(preview);
    expect(() => parseChannelPreview({ lead: "nope" })).toThrow(ContractError);
  });

  it("validates active-channels responses", () => {
    const preview = derivePreview(expanded);
    expect(
      parseActiveChannels({
        channels: [
          { code: "12345", preview },
          { code: "00001", preview },
        ],
      }),
    ).toEqual({
      channels: [
        { code: "12345", preview },
        { code: "00001", preview },
      ],
    });
    expect(() => parseActiveChannels({ channels: [{ code: "1234", preview }] })).toThrow(
      ContractError,
    );
    expect(() => parseActiveChannels({ channels: "12345" })).toThrow(ContractError);
  });
});
