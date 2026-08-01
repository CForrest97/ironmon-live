export type ExtensionComparison = "missing" | "current" | "different";

export const compareExtension = (
  bundled: string,
  installed: string | undefined,
): ExtensionComparison => {
  if (installed === undefined) return "missing";
  return installed === bundled ? "current" : "different";
};

export const backupName = (observedAt: Date) =>
  `IronMONLive.lua.backup-${observedAt.toISOString().replaceAll(":", "-")}`;
