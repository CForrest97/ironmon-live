import { isChannelCode } from "@ironmon-live/contracts";
export { LiveChannel } from "./channel.ts";

type Env = {
  readonly CHANNELS: DurableObjectNamespace;
  readonly ASSETS: Fetcher;
  readonly EXPIRY_MINUTES: string;
};

const apiMatch = /^\/api\/channels\/(\d{5})\/(publish|snapshot|connect)$/;

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const match = apiMatch.exec(url.pathname);
    if (!match) return env.ASSETS.fetch(request);
    const code = match[1];
    if (!code || !isChannelCode(code))
      return Response.json({ error: "invalid channel" }, { status: 400 });
    return env.CHANNELS.get(env.CHANNELS.idFromName(code)).fetch(request);
  },
} satisfies ExportedHandler<Env>;
