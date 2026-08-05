import { parseActiveChannels, parseChannelEvent, type ChannelEvent } from "@ironmon-live/contracts";

export const channelSocketUrl = (code: string, location: Location = window.location) => {
  const protocol = location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${location.host}/api/channels/${code}/connect`;
};

export const fetchActiveChannels = async (): Promise<readonly string[]> => {
  const response = await fetch("/api/channels");
  if (!response.ok) throw new Error(`failed to fetch active channels: ${String(response.status)}`);
  return parseActiveChannels(await response.json()).channels;
};

export const subscribeToChannel = (
  code: string,
  onEvent: (event: ChannelEvent) => void,
  onConnection: (connected: boolean) => void,
) => {
  let stopped = false;
  let socket: WebSocket | undefined;
  let retry = 500;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const connect = () => {
    if (stopped) return;
    socket = new WebSocket(channelSocketUrl(code));
    socket.addEventListener("open", () => {
      retry = 500;
      onConnection(true);
    });
    socket.addEventListener("message", (message) => {
      try {
        onEvent(parseChannelEvent(JSON.parse(String(message.data)) as unknown));
      } catch {
        socket?.close();
      }
    });
    socket.addEventListener("close", () => {
      onConnection(false);
      if (!stopped) {
        timer = setTimeout(connect, retry);
        retry = Math.min(retry * 2, 10_000);
      }
    });
  };
  connect();
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    socket?.close();
  };
};
