import { describe, expect, it } from "vitest";
import { expandLegacySnapshot, normalizeForPublication } from "./expanded-state";

const legacy = {
  kind: "snapshot" as const,
  schemaVersion: 1 as const,
  observedAt: "2026-08-01T10:00:00Z",
  status: "active",
  party: [
    {
      id: "1",
      name: "Bulbasaur",
      types: { availability: "available" as const, value: ["grass"] },
      ivs: { availability: "available" as const, value: { hp: 0 } },
      evs: { availability: "unavailable" as const },
      stats: { availability: "available" as const, value: { hp: 12 } },
      moves: { availability: "available" as const, value: ["Tackle"] },
    },
  ],
  route: { availability: "unavailable" as const },
};

describe("expanded companion state", () => {
  it("turns a legacy snapshot into one deterministic active-battle v2 snapshot", () => {
    const expanded = expandLegacySnapshot(legacy);
    expect(expanded).toMatchObject({
      schemaVersion: 2,
      party: [{ name: "Bulbasaur", types: legacy.party[0]?.types }],
      location: { availability: "available", value: { name: "Sample Route" } },
      battle: { availability: "available", value: { active: true, kind: "trainer" } },
      route: {
        availability: "available",
        value: {
          name: "Sample Route",
          trainers: [
            {
              trainerClass: { availability: "available", value: "Ace Trainer" },
              portraitId: { availability: "available", value: "acetrainer-gen3" },
            },
          ],
        },
      },
    });
    expect(expandLegacySnapshot(legacy)).toEqual(expanded);
  });

  it("forwards an expanded snapshot without changing it", () => {
    const expanded = expandLegacySnapshot(legacy);
    expect(normalizeForPublication(expanded)).toBe(expanded);
  });
});
