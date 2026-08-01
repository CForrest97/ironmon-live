import { performance } from "node:perf_hooks";
import { describe, expect, it } from "vitest";
import { createPublisher } from "./publisher.ts";

describe("publication latency harness", () => {
  it("delivers at least 95% of representative publications within one second", async () => {
    const durations: number[] = [];
    const publish = createPublisher({
      baseUrl: "https://example.test",
      channelCode: "00042",
      sessionId: "latency-session",
      fetch: () => Promise.resolve(new Response(null, { status: 204 })),
    });
    for (let index = 0; index < 20; index += 1) {
      const startedAt = performance.now();
      await publish({ kind: "heartbeat", schemaVersion: 1, observedAt: new Date().toISOString() });
      durations.push(performance.now() - startedAt);
    }
    const underTarget = durations.filter((duration) => duration <= 1_000).length;
    expect(underTarget / durations.length).toBeGreaterThanOrEqual(0.95);
  });
});
