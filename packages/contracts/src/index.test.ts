import { describe, expect, it } from "vitest";
import { ContractError, isChannelCode, parseTrackerMessage } from "./index.ts";

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

describe("tracker contract", () => {
  it("preserves zero and empty values as available", () => {
    expect(parseTrackerMessage(base)).toEqual(base);
  });

  it("rejects unknown schema versions", () => {
    expect(() => parseTrackerMessage({ ...base, schemaVersion: 2 })).toThrow(ContractError);
  });

  it("validates channel codes", () => {
    expect(isChannelCode("00001")).toBe(true);
    expect(isChannelCode("1234")).toBe(false);
  });
});
