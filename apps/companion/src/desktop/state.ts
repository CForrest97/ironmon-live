import type { CompanionState, DesktopConfig } from "./types";

export const initialState = (
  config: DesktopConfig,
  appVersion: string,
  startAtLogin: boolean,
): CompanionState => {
  const shared = {
    channelCode: config.channelCode,
    appVersion,
    startAtLogin,
    paused: config.paused,
    disclosureAccepted: config.disclosureAccepted,
    trackerExtensionDirectory: config.trackerExtensionDirectory,
    trackerExtensionStatus: "unknown" as const,
  };
  if (!config.disclosureAccepted) {
    return {
      ...shared,
      status: "setup_required",
      explanation: "Review how IronMON Live publishes your run before continuing.",
      recommendedAction: "accept_disclosure",
    };
  }
  if (config.paused) {
    return {
      ...shared,
      status: "paused",
      explanation: "Publishing is paused.",
      recommendedAction: "resume",
    };
  }
  return {
    ...shared,
    status: "waiting_for_tracker",
    explanation: "Waiting for fresh IronMON Tracker data.",
    recommendedAction: config.trackerExtensionDirectory ? undefined : "choose_tracker_folder",
  };
};
