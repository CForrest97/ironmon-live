import { describe, expect, it } from "vitest";
import { backupName, compareExtension } from "./extension";

describe("Tracker extension decisions", () => {
  it("distinguishes missing, current, and different installations", () => {
    expect(compareExtension("new", undefined)).toBe("missing");
    expect(compareExtension("new", "new")).toBe("current");
    expect(compareExtension("new", "old")).toBe("different");
  });

  it("creates a filesystem-safe timestamped backup name", () => {
    expect(backupName(new Date("2026-08-01T10:11:12.000Z"))).toBe(
      "IronMONLive.lua.backup-2026-08-01T10-11-12.000Z",
    );
  });
});
