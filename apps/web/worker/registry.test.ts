import { describe, expect, it } from "vitest";
import { activeCodes } from "./registry-store.ts";

describe("activeCodes", () => {
  it("returns registered codes that have not expired, sorted", () => {
    const entries = new Map([
      ["00002", 2000],
      ["00001", 2000],
    ]);
    expect(activeCodes(entries, 1000)).toEqual(["00001", "00002"]);
  });

  it("excludes codes whose expiry has passed", () => {
    const entries = new Map([
      ["00001", 500],
      ["00002", 2000],
    ]);
    expect(activeCodes(entries, 1000)).toEqual(["00002"]);
  });

  it("returns an empty list when nothing is registered", () => {
    expect(activeCodes(new Map(), 1000)).toEqual([]);
  });
});
