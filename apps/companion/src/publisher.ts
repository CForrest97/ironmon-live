import type { Publication, TrackerMessage } from "@ironmon-live/contracts";

export type PublisherOptions = {
  readonly baseUrl: string;
  readonly channelCode: string;
  readonly sessionId: string;
  readonly fetch?: typeof globalThis.fetch;
};

export const createPublisher = (options: PublisherOptions) => {
  const request = options.fetch ?? globalThis.fetch;
  const endpoint = new URL(`/api/channels/${options.channelCode}/publish`, options.baseUrl);

  return async (message: TrackerMessage) => {
    const publication: Publication = { sessionId: options.sessionId, message };
    const response = await request(endpoint, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(publication),
    });
    if (!response.ok) {
      throw new Error(`publication failed with HTTP ${String(response.status)}`);
    }
  };
};
