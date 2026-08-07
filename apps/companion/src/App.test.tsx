import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { App, type CompanionActions } from "./App";

const actions = Object.fromEntries(
  [
    "acceptDisclosure",
    "chooseTrackerFolder",
    "retry",
    "setPaused",
    "setStartAtLogin",
    "openLiveView",
    "copyChannelCode",
    "copyPublishDiagnostics",
    "checkForUpdates",
    "resetChannelCode",
  ].map((name) => [name, vi.fn(() => Promise.resolve())]),
) as unknown as CompanionActions;

describe("companion settings", () => {
  it("explains automatic unauthenticated publishing before consent", () => {
    render(
      <App
        actions={actions}
        state={{
          status: "setup_required",
          explanation: "Review publishing.",
          channelCode: "00042",
          appVersion: "0.1.0",
          startAtLogin: false,
          paused: false,
          disclosureAccepted: false,
          trackerExtensionStatus: "unknown",
        }}
      />,
    );
    expect(screen.getByText(/not a password/u)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "I understand" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy publish diagnostics" })).toBeInTheDocument();
  });

  it("offers an immediate retry only while publication is retrying", () => {
    render(
      <App
        actions={actions}
        state={{
          status: "offline_retrying",
          explanation: "IronMON Live is unavailable.",
          channelCode: "00042",
          appVersion: "0.1.0",
          startAtLogin: false,
          paused: false,
          disclosureAccepted: true,
          trackerExtensionStatus: "unknown",
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Retry now" }));
    expect(actions.retry).toHaveBeenCalledOnce();
  });
});
