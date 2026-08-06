import type { TrackerMessage } from "@ironmon-live/contracts";

export type CompanionStatus =
  | "setup_required"
  | "waiting_for_tracker"
  | "live"
  | "offline_retrying"
  | "unsupported"
  | "action_required"
  | "paused";

export type TrackerExtensionStatus = "missing" | "current" | "different" | "unknown";
export type CompanionAction = "accept_disclosure" | "choose_tracker_folder" | "resume" | "retry";

export type CompanionState = {
  readonly status: CompanionStatus;
  readonly explanation: string;
  readonly recommendedAction?: CompanionAction;
  readonly channelCode: string;
  readonly appVersion: string;
  readonly startAtLogin: boolean;
  readonly paused: boolean;
  readonly disclosureAccepted: boolean;
  readonly trackerExtensionDirectory?: string;
  readonly trackerExtensionStatus: TrackerExtensionStatus;
  readonly lastPublishedAt?: string;
  readonly retryAttempt?: number;
};

export type DesktopConfig = {
  readonly channelCode: string;
  readonly inputPath: string;
  readonly publishUrl: string;
  readonly disclosureAccepted: boolean;
  readonly paused: boolean;
  readonly notifications: boolean;
  readonly trackerExtensionDirectory?: string;
};

export type PublicationClient = (message: TrackerMessage) => Promise<void>;
export type Scheduler = {
  readonly now: () => number;
  readonly setTimeout: (callback: () => void, milliseconds: number) => number;
  readonly clearTimeout: (id: number) => void;
};
