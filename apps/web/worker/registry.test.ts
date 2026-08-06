import { describe, expect, it } from "vitest";
import type { ChannelPreview } from "@ironmon-live/contracts";
import { activeCodes, type RegistryEntry } from "./registry-store.ts";

const preview: ChannelPreview = {
  lead: { availability: "unavailable" },
  location: { availability: "unavailable" },
  game: { availability: "unavailable" },
};
const entry = (expiresAt: number): RegistryEntry => ({ expiresAt, preview });

describe("activeCodes", () => {
  it("returns registered codes that have not expired, sorted, with their preview", () => {
    const entries = new Map([
      ["00002", entry(2000)],
      ["00001", entry(2000)],
    ]);
    expect(activeCodes(entries, 1000)).toEqual([
      { code: "00001", preview },
      { code: "00002", preview },
    ]);
  });

  it("excludes codes whose expiry has passed", () => {
    const entries = new Map([
      ["00001", entry(500)],
      ["00002", entry(2000)],
    ]);
    expect(activeCodes(entries, 1000)).toEqual([{ code: "00002", preview }]);
  });

  it("returns an empty list when nothing is registered", () => {
    expect(activeCodes(new Map(), 1000)).toEqual([]);
  });
});
