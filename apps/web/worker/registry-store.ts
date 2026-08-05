export const activeCodes = (entries: ReadonlyMap<string, number>, now: number): readonly string[] =>
  [...entries]
    .filter(([, expiresAt]) => expiresAt > now)
    .map(([code]) => code)
    .sort();
