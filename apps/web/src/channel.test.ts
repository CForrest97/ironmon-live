import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { channelSocketUrl, subscribeToChannel } from "./channel.ts";

describe("channel socket URL", () => {
  it("uses secure websockets on HTTPS", () => {
    expect(
      channelSocketUrl("00042", { protocol: "https:", host: "ironmon.live" } as Location),
    ).toBe("wss://ironmon.live/api/channels/00042/connect");
  });
});

class FakeSocket {
  static instances: FakeSocket[] = [];
  private readonly listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }

  addEventListener(type: string, listener: (event: unknown) => void) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }

  close() {
    this.emit("close", {});
  }

  emit(type: string, event: unknown) {
    this.listeners.get(type)?.forEach((listener) => {
      listener(event);
    });
  }
}

describe("subscribeToChannel", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal("window", { location: { protocol: "https:", host: "ironmon.live" } });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("routes heartbeat messages to onActivity but not onEvent", () => {
    const events: unknown[] = [];
    const activity: number[] = [];
    const unsubscribe = subscribeToChannel(
      "00042",
      (event) => events.push(event),
      () => undefined,
      (lastMessageAt) => activity.push(lastMessageAt),
    );
    const socket = FakeSocket.instances.at(0);
    if (!socket) throw new Error("expected a socket to be constructed");
    socket.emit("message", {
      data: JSON.stringify({ type: "heartbeat", observedAt: new Date().toISOString() }),
    });
    expect(events).toEqual([]);
    expect(activity).toHaveLength(1);

    socket.emit("message", { data: JSON.stringify({ type: "inactive" }) });
    expect(events).toEqual([{ type: "inactive" }]);
    expect(activity).toHaveLength(2);

    unsubscribe();
  });

  it("ignores unparseable messages without closing the socket", () => {
    const closedStates: boolean[] = [];
    const unsubscribe = subscribeToChannel(
      "00042",
      () => undefined,
      (connected) => closedStates.push(connected),
    );
    const socket = FakeSocket.instances.at(0);
    if (!socket) throw new Error("expected a socket to be constructed");
    socket.emit("open", {});
    socket.emit("message", { data: "not json" });
    expect(closedStates).toEqual([true]);

    unsubscribe();
  });
});
