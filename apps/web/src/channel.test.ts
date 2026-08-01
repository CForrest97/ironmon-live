import { describe, expect, it } from "vitest";
import { channelSocketUrl } from "./channel.ts";

describe("channel socket URL", () => {
  it("uses secure websockets on HTTPS", () => {
    expect(
      channelSocketUrl("00042", { protocol: "https:", host: "ironmon.live" } as Location),
    ).toBe("wss://ironmon.live/api/channels/00042/connect");
  });
});
