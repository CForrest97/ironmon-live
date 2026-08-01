import { isChannelCode } from "@ironmon-live/contracts";
import type { DesktopConfig } from "./types";

const channelCode = () => {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return String((value[0] ?? 0) % 100_000).padStart(5, "0");
};

export const defaultDesktopConfig = (homeDirectory: string): DesktopConfig => ({
  channelCode: channelCode(),
  inputPath: `${homeDirectory}/.ironmon-live/tracker.json`,
  publishUrl: "https://live.craigforrest.co.uk",
  disclosureAccepted: false,
  paused: false,
  notifications: true,
});

export const parseDesktopConfig = (value: unknown, homeDirectory: string): DesktopConfig => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Companion configuration must be an object.");
  }
  const candidate = value as Partial<DesktopConfig>;
  if (
    typeof candidate.channelCode !== "string" ||
    !isChannelCode(candidate.channelCode) ||
    typeof candidate.inputPath !== "string" ||
    typeof candidate.publishUrl !== "string"
  ) {
    throw new Error("Companion configuration is invalid.");
  }
  const parsedPublishUrl = new URL(candidate.publishUrl);
  const publishUrl =
    parsedPublishUrl.origin === "https://ironmon.live"
      ? "https://live.craigforrest.co.uk"
      : candidate.publishUrl;
  return {
    ...defaultDesktopConfig(homeDirectory),
    channelCode: candidate.channelCode,
    inputPath: candidate.inputPath,
    publishUrl,
    disclosureAccepted: candidate.disclosureAccepted ?? false,
    paused: candidate.paused ?? false,
    notifications: candidate.notifications ?? true,
    trackerExtensionDirectory: candidate.trackerExtensionDirectory,
  };
};
