import { describe, expect, it } from "vitest";
import { trayItems } from "./tray";

describe("tray menu", () => {
  it("uses the current state for status and publishing control", () => {
    const items = trayItems({
      status: "paused",
      explanation: "Paused",
      channelCode: "00042",
      appVersion: "0.1.0",
      startAtLogin: true,
      paused: true,
      disclosureAccepted: true,
      trackerExtensionStatus: "current",
    });
    expect(items[0]).toMatchObject({ text: "Paused", enabled: false });
    expect(items.find(({ id }) => id === "pause")?.text).toBe("Resume Publishing");
    expect(items.find(({ id }) => id === "autostart")?.checked).toBe(true);
  });
});
