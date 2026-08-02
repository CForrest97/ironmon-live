import { describe, expect, it, vi } from "vitest";
import { createCompanionController } from "./controller";
import type { CompanionState, Scheduler } from "./types";

const baseState: CompanionState = {
  status: "waiting_for_tracker",
  explanation: "Waiting",
  channelCode: "00042",
  appVersion: "0.1.0",
  startAtLogin: false,
  paused: false,
  disclosureAccepted: true,
  trackerExtensionStatus: "unknown",
};
const scheduler = (): Scheduler => ({
  now: () => Date.parse("2026-08-01T10:00:00Z"),
  setTimeout: () => 1,
  clearTimeout: vi.fn(),
});
const snapshot = (observedAt = "2026-08-01T10:00:00Z") => ({
  kind: "snapshot" as const,
  schemaVersion: 1 as const,
  observedAt,
  status: "active",
  party: [],
  route: { availability: "unavailable" as const },
});

describe("companion controller", () => {
  it("becomes live only after publication succeeds", async () => {
    const publish = vi.fn(() => Promise.resolve());
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: Date.parse("2026-08-01T09:59:00Z"),
      publish,
      scheduler: scheduler(),
    });
    await controller.receive(snapshot());
    expect(publish).toHaveBeenCalledOnce();
    expect(controller.getState().status).toBe("live");
  });

  it("rejects state from before this publishing session", async () => {
    const publish = vi.fn(() => Promise.resolve());
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: Date.parse("2026-08-01T10:00:00Z"),
      publish,
      scheduler: scheduler(),
    });
    await controller.receive(snapshot("2026-08-01T09:59:59Z"));
    expect(publish).not.toHaveBeenCalled();
  });

  it("retains the latest state while offline and recovers", async () => {
    const publish = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(undefined);
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: 0,
      publish,
      scheduler: scheduler(),
      random: () => 0.5,
    });
    await controller.receive(snapshot());
    expect(controller.getState().status).toBe("offline_retrying");
    expect(controller.getState().explanation).toContain("Details: offline");
    controller.retry();
    await vi.waitFor(() => {
      expect(controller.getState().status).toBe("live");
    });
  });

  it("does not publish while paused", async () => {
    const publish = vi.fn(() => Promise.resolve());
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: 0,
      publish,
      scheduler: scheduler(),
    });
    controller.setPaused(true);
    await controller.receive(snapshot());
    expect(controller.getState().status).toBe("paused");
    expect(publish).not.toHaveBeenCalled();
  });

  it("does not claim live or publish when only a source heartbeat arrives", async () => {
    const publish = vi.fn(() => Promise.resolve());
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: 0,
      publish,
      scheduler: scheduler(),
    });
    await controller.receive({
      kind: "heartbeat",
      schemaVersion: 1,
      observedAt: "2026-08-01T10:00:00Z",
    });
    expect(controller.getState().status).toBe("waiting_for_tracker");
    expect(publish).not.toHaveBeenCalled();
  });

  it("uses the expanded heartbeat version after normalizing a legacy snapshot", async () => {
    const publish = vi.fn(() => Promise.resolve());
    const scheduled: Array<() => void> = [];
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: 0,
      publish,
      scheduler: {
        now: () => Date.parse("2026-08-01T10:00:00Z"),
        setTimeout: (callback) => {
          scheduled.push(callback);
          return scheduled.length;
        },
        clearTimeout: vi.fn(),
      },
    });
    await controller.receive(snapshot());
    scheduled.at(-1)?.();
    await vi.waitFor(() => {
      expect(publish).toHaveBeenLastCalledWith(
        expect.objectContaining({ kind: "heartbeat", schemaVersion: 2 }),
      );
    });
  });

  it("reports unsupported input locally without deleting remote state", async () => {
    const publish = vi.fn(() => Promise.resolve());
    const controller = createCompanionController({
      initialState: baseState,
      startedAt: 0,
      publish,
      scheduler: scheduler(),
    });
    await controller.receive({
      kind: "unsupported",
      schemaVersion: 1,
      observedAt: "2026-08-01T10:00:00Z",
      reason: "Unsupported game",
    });
    expect(controller.getState().status).toBe("unsupported");
    expect(publish).not.toHaveBeenCalled();
  });
});
