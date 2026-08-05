import { DurableObject } from "cloudflare:workers";
import { isChannelCode } from "@ironmon-live/contracts";
import { activeCodes } from "./registry-store.ts";

const json = (value: unknown, status = 200) =>
  Response.json(value, { status, headers: { "cache-control": "no-store" } });

export class ChannelRegistry extends DurableObject {
  private async register(request: Request) {
    let body: unknown;
    try {
      body = await request.json();
    } catch (error) {
      return json({ error: String(error) }, 400);
    }
    const record = body as Record<string, unknown>;
    if (
      typeof body !== "object" ||
      body === null ||
      typeof record.code !== "string" ||
      !isChannelCode(record.code) ||
      typeof record.expiresAt !== "number" ||
      !Number.isFinite(record.expiresAt)
    ) {
      return json({ error: "code and expiresAt are required" }, 400);
    }
    const { code, expiresAt } = record as { code: string; expiresAt: number };
    await this.ctx.storage.put(code, expiresAt);
    return new Response(null, { status: 204 });
  }

  private async unregister(url: URL) {
    const code = url.searchParams.get("code");
    if (!code || !isChannelCode(code)) return json({ error: "code is required" }, 400);
    await this.ctx.storage.delete(code);
    return new Response(null, { status: 204 });
  }

  private async list() {
    const entries = await this.ctx.storage.list<number>();
    const now = Date.now();
    const expired = [...entries].filter(([, expiresAt]) => expiresAt <= now).map(([code]) => code);
    if (expired.length > 0) await this.ctx.storage.delete(expired);
    return Response.json(
      { channels: activeCodes(entries, now) },
      { headers: { "cache-control": "public, max-age=5" } },
    );
  }

  override async fetch(request: Request) {
    const url = new URL(request.url);
    if (url.pathname.endsWith("/register") && request.method === "PUT")
      return this.register(request);
    if (url.pathname.endsWith("/register") && request.method === "DELETE")
      return this.unregister(url);
    if (url.pathname.endsWith("/channels") && request.method === "GET") return this.list();
    return json({ error: "not found" }, 404);
  }
}
