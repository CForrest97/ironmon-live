import type { CompanionState } from "./types";

export type TrayItem = {
  readonly id: string;
  readonly text: string;
  readonly enabled?: boolean;
  readonly checked?: boolean;
};

const statusLabel: Readonly<Record<CompanionState["status"], string>> = {
  setup_required: "Setup required",
  waiting_for_tracker: "Waiting for Tracker",
  live: "Live",
  offline_retrying: "Offline — retrying",
  unsupported: "Unsupported",
  action_required: "Action required",
  paused: "Paused",
};

export const trayItems = (state: CompanionState): readonly TrayItem[] => [
  { id: "status", text: statusLabel[state.status], enabled: false },
  { id: "open-live", text: "Open Live View" },
  { id: "copy-code", text: "Copy Channel Code" },
  { id: "pause", text: state.paused ? "Resume Publishing" : "Pause Publishing" },
  { id: "settings", text: "Settings…" },
  { id: "update", text: "Check for Updates…" },
  { id: "autostart", text: "Start at Login", checked: state.startAtLogin },
  { id: "quit", text: "Quit IronMON Live" },
];
