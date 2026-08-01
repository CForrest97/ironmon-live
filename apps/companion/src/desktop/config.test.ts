import { describe, expect, it } from "vitest";
import { parseDesktopConfig } from "./config";

describe("desktop configuration", () => {
  it("migrates the existing CLI configuration without changing its channel", () => {
    expect(
      parseDesktopConfig(
        {
          channelCode: "00042",
          inputPath: "/Users/player/.ironmon-live/tracker.json",
          publishUrl: "https://ironmon.live",
        },
        "/Users/player",
      ),
    ).toMatchObject({
      channelCode: "00042",
      publishUrl: "https://live.craigforrest.co.uk",
      disclosureAccepted: false,
      paused: false,
      notifications: true,
    });
  });
});
