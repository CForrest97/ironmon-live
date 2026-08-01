import { describe, expect, it, vi } from "vitest";
import { createPublisher } from "./publisher.ts";

describe("publisher", () => {
  it("publishes the session and message to its channel", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    const publish = createPublisher({
      baseUrl: "https://example.test",
      channelCode: "00042",
      sessionId: "session-a",
      fetch: request,
    });
    await publish({ kind: "heartbeat", schemaVersion: 1, observedAt: new Date().toISOString() });
    expect(request).toHaveBeenCalledOnce();
    const requestedUrl = request.mock.calls[0]?.[0];
    expect(requestedUrl instanceof URL ? requestedUrl.href : undefined).toBe(
      "https://example.test/api/channels/00042/publish",
    );
  });
});
