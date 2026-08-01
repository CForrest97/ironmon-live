import { mkdtemp, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { watchSnapshots } from "./watcher.ts";

describe("snapshot watcher", () => {
  it("ignores stale input and consumes an atomic replacement", async () => {
    const directory = await mkdtemp(join(tmpdir(), "ironmon-live-"));
    const target = join(directory, "tracker.json");
    await writeFile(target, "{}");
    const received = new Promise<string>((resolve) => {
      const watcher = watchSnapshots({
        path: target,
        startedAt: Date.now(),
        onMessage: (message) => {
          resolve(message.kind);
          watcher.close();
          return Promise.resolve();
        },
      });
    });
    const replacement = join(directory, "next.json");
    await writeFile(
      replacement,
      JSON.stringify({
        kind: "heartbeat",
        schemaVersion: 1,
        observedAt: new Date().toISOString(),
      }),
    );
    await rename(replacement, target);
    await expect(received).resolves.toBe("heartbeat");
  });
});
