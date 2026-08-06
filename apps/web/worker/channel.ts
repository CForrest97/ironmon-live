import { DurableObject } from "cloudflare:workers";
import {
  derivePreview,
  parsePublication,
  type ChannelEvent,
  type RunSnapshot,
} from "@ironmon-live/contracts";

type Env = {
  readonly EXPIRY_MINUTES: string;
  readonly REGISTRY: DurableObjectNamespace;
};

const snapshotKey = "snapshot";
const expiresAtKey = "expiresAt";
const sessionIdKey = "sessionId";
const lastRegisteredAtKey = "lastRegisteredAt";
const registryRefreshMilliseconds = 60_000;

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "cache-control": "no-store" } });

export class LiveChannel extends DurableObject<Env> {
  private expiryMilliseconds() {
    const minutes = Number(this.env.EXPIRY_MINUTES);
    if (!Number.isFinite(minutes) || minutes < 30 || minutes > 60) {
      throw new Error("EXPIRY_MINUTES must be between 30 and 60");
    }
    return minutes * 60_000;
  }

  private broadcast(event: ChannelEvent) {
    const payload = JSON.stringify(event);
    this.ctx.getWebSockets().forEach((socket) => {
      socket.send(payload);
    });
  }

  private registryStub() {
    return this.env.REGISTRY.get(this.env.REGISTRY.idFromName("singleton"));
  }

  private async registerActive(expiresAt: number, snapshot: RunSnapshot) {
    const code = this.ctx.id.name;
    if (!code) return;
    const lastRegisteredAt = await this.ctx.storage.get<number>(lastRegisteredAtKey);
    const now = Date.now();
    if (lastRegisteredAt !== undefined && now - lastRegisteredAt < registryRefreshMilliseconds)
      return;
    await this.ctx.storage.put(lastRegisteredAtKey, now);
    this.ctx.waitUntil(
      this.registryStub()
        .fetch("https://registry/register", {
          method: "PUT",
          body: JSON.stringify({ code, expiresAt, preview: derivePreview(snapshot) }),
        })
        .catch((error: unknown) => {
          console.error("registry PUT failed", { code, error: String(error) });
        }),
    );
  }

  private unregisterActive() {
    const code = this.ctx.id.name;
    if (!code) return;
    this.ctx.waitUntil(
      this.registryStub()
        .fetch(`https://registry/register?code=${code}`, { method: "DELETE" })
        .catch(() => undefined),
    );
  }

  private async inactive() {
    await this.ctx.storage.deleteAll();
    this.unregisterActive();
    this.broadcast({ type: "inactive" });
  }

  private async currentEvent(): Promise<ChannelEvent> {
    const snapshot = await this.ctx.storage.get<RunSnapshot>(snapshotKey);
    return snapshot ? { type: "active", snapshot } : { type: "inactive" };
  }

  private async publish(request: Request) {
    let publication;
    try {
      const body = await request.text();
      if (body.length > 262_144) return json({ error: "publication too large" }, 413);
      publication = parsePublication(JSON.parse(body) as unknown);
    } catch (error) {
      console.error("publish parse failed", { error: String(error) });
      return json({ error: String(error) }, 400);
    }

    if (publication.message.kind === "unsupported") {
      await this.inactive();
      return new Response(null, { status: 204 });
    }

    const expiresAt = Date.now() + this.expiryMilliseconds();
    if (publication.message.kind === "snapshot") {
      await this.ctx.storage.put({
        [snapshotKey]: publication.message,
        [expiresAtKey]: expiresAt,
        [sessionIdKey]: publication.sessionId,
      });
      this.broadcast({ type: "active", snapshot: publication.message });
    } else {
      const [snapshot, sessionId] = await Promise.all([
        this.ctx.storage.get(snapshotKey),
        this.ctx.storage.get<string>(sessionIdKey),
      ]);
      if (!snapshot || sessionId !== publication.sessionId) {
        console.warn("heartbeat dropped: sessionId mismatch", {
          code: this.ctx.id.name,
          expected: sessionId,
          got: publication.sessionId,
        });
        return new Response(null, { status: 204 });
      }
      await this.ctx.storage.put(expiresAtKey, expiresAt);
      this.broadcast({ type: "heartbeat", observedAt: publication.message.observedAt });
    }
    const currentSnapshot = await this.ctx.storage.get<RunSnapshot>(snapshotKey);
    if (currentSnapshot) {
      await this.ctx.storage.setAlarm(expiresAt);
      await this.registerActive(expiresAt, currentSnapshot);
    }
    return new Response(null, { status: 204 });
  }

  private async connectViewer(request: Request) {
    if (request.headers.get("upgrade") !== "websocket") {
      return json({ error: "websocket upgrade required" }, 426);
    }
    const pair = new WebSocketPair();
    const client = pair[0];
    const server = pair[1];
    this.ctx.acceptWebSocket(server);
    server.send(JSON.stringify(await this.currentEvent()));
    return new Response(null, { status: 101, webSocket: client });
  }

  override async fetch(request: Request) {
    const pathname = new URL(request.url).pathname;
    if (pathname.endsWith("/publish") && request.method === "PUT") return this.publish(request);
    if (pathname.endsWith("/snapshot") && request.method === "GET") {
      return json(await this.currentEvent());
    }
    if (pathname.endsWith("/connect") && request.method === "GET") {
      return this.connectViewer(request);
    }
    return json({ error: "not found" }, 404);
  }

  override async alarm() {
    const expiresAt = await this.ctx.storage.get<number>(expiresAtKey);
    if (expiresAt && expiresAt > Date.now()) {
      await this.ctx.storage.setAlarm(expiresAt);
      return;
    }
    await this.inactive();
  }
}
