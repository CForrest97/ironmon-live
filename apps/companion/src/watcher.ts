import { unwatchFile, watchFile } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import { parseTrackerMessage, type TrackerMessage } from "@ironmon-live/contracts";

export type SnapshotWatcherOptions = {
  readonly path: string;
  readonly startedAt?: number;
  readonly retryDelayMs?: number;
  readonly retries?: number;
  readonly onMessage: (message: TrackerMessage) => Promise<void>;
  readonly onError?: (error: unknown) => void | Promise<void>;
};

const delay = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const readFreshMessage = async (
  path: string,
  startedAt: number,
  retries: number,
  retryDelayMs: number,
) => {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const metadata = await stat(path);
      if (metadata.mtimeMs < startedAt) return undefined;
      return parseTrackerMessage(JSON.parse(await readFile(path, "utf8")) as unknown);
    } catch (error) {
      lastError = error;
      if (attempt < retries) await delay(retryDelayMs);
    }
  }
  throw lastError;
};

export const watchSnapshots = (options: SnapshotWatcherOptions) => {
  const startedAt = options.startedAt ?? Date.now();
  const retryDelayMs = options.retryDelayMs ?? 25;
  const retries = options.retries ?? 4;
  let queue = Promise.resolve();

  const consume = () => {
    queue = queue
      .then(async () => {
        const message = await readFreshMessage(options.path, startedAt, retries, retryDelayMs);
        if (message) await options.onMessage(message);
      })
      .catch(async (error: unknown) => {
        await options.onError?.(error);
      });
  };

  watchFile(options.path, { interval: 100 }, consume);

  consume();
  return {
    close: () => {
      unwatchFile(options.path, consume);
    },
  };
};
