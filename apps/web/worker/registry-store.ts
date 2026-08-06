import type { ChannelPreview } from "@ironmon-live/contracts";

export type RegistryEntry = { readonly expiresAt: number; readonly preview: ChannelPreview };

export const activeCodes = (
  entries: ReadonlyMap<string, RegistryEntry>,
  now: number,
): ReadonlyArray<{ readonly code: string; readonly preview: ChannelPreview }> =>
  [...entries]
    .filter(([, entry]) => entry.expiresAt > now)
    .map(([code, entry]) => ({ code, preview: entry.preview }))
    .sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
