import type { RunSnapshot, TrackerMessage } from "@ironmon-live/contracts";
import { normalizeForPublication } from "../expanded-state";
import type { CompanionState, PublicationClient, Scheduler } from "./types";

export type ControllerOptions = {
  readonly initialState: CompanionState;
  readonly startedAt: number;
  readonly publish: PublicationClient;
  readonly scheduler: Scheduler;
  readonly heartbeatMs?: number;
  readonly sourceStaleMs?: number;
  readonly random?: () => number;
};

export const createCompanionController = (options: ControllerOptions) => {
  const listeners = new Set<(state: CompanionState) => void>();
  const heartbeatMs = options.heartbeatMs ?? 2_000;
  const sourceStaleMs = options.sourceStaleMs ?? 5_000;
  const random = options.random ?? Math.random;
  let state = options.initialState;
  let latest: RunSnapshot | undefined;
  let retryAttempt = 0;
  let timer: number | undefined;
  let staleTimer: number | undefined;
  let stopped = false;

  const update = (next: CompanionState) => {
    state = next;
    listeners.forEach((listener) => {
      listener(state);
    });
  };
  const clearTimer = () => {
    if (timer !== undefined) options.scheduler.clearTimeout(timer);
    timer = undefined;
  };
  const schedule = (milliseconds: number, callback: () => void) => {
    clearTimer();
    timer = options.scheduler.setTimeout(callback, milliseconds);
  };
  const clearStaleTimer = () => {
    if (staleTimer !== undefined) options.scheduler.clearTimeout(staleTimer);
    staleTimer = undefined;
  };
  const markWaiting = () => {
    clearTimer();
    latest = undefined;
    update({
      ...state,
      status: "waiting_for_tracker",
      explanation: "Waiting for fresh IronMON Tracker data.",
      recommendedAction: undefined,
    });
  };
  const scheduleRetry = (error: unknown) => {
    retryAttempt += 1;
    const detail =
      error instanceof Error
        ? ` Details: ${error.message}`
        : typeof error === "string"
          ? ` Details: ${error}`
          : JSON.stringify(error, null, 2);
    update({
      ...state,
      status: "offline_retrying",
      explanation: `IronMON Live is unavailable. The companion will retry automatically.${detail}`,
      recommendedAction: "retry",
    });
    const base = Math.min(30_000, 1_000 * 2 ** Math.min(retryAttempt - 1, 5));
    schedule(Math.round(base * (0.8 + random() * 0.4)), () => void publishLatest());
  };
  const publishHeartbeat = async (): Promise<void> => {
    if (stopped || state.paused || !state.disclosureAccepted) return;
    try {
      await options.publish({
        kind: "heartbeat",
        schemaVersion: latest?.schemaVersion ?? 1,
        observedAt: new Date(options.scheduler.now()).toISOString(),
      });
      retryAttempt = 0;
      schedule(heartbeatMs, () => void publishHeartbeat());
    } catch (error) {
      scheduleRetry(error);
    }
  };
  const publishLatest = async (): Promise<void> => {
    if (!latest || stopped || state.paused || !state.disclosureAccepted) return;
    const current = latest;
    try {
      await options.publish(current);
      retryAttempt = 0;
      update({
        ...state,
        status: "live",
        explanation: "Your current run is live.",
        recommendedAction: undefined,
        lastPublishedAt: new Date(options.scheduler.now()).toISOString(),
      });
      schedule(heartbeatMs, () => void publishHeartbeat());
    } catch (error) {
      scheduleRetry(error);
    }
  };

  return {
    getState: () => state,
    subscribe: (listener: (next: CompanionState) => void) => {
      listeners.add(listener);
      listener(state);
      return () => {
        listeners.delete(listener);
      };
    },
    receive: async (message: TrackerMessage) => {
      const normalized = normalizeForPublication(message);
      if (Date.parse(normalized.observedAt) < options.startedAt) return;
      clearStaleTimer();
      staleTimer = options.scheduler.setTimeout(markWaiting, sourceStaleMs);
      if (normalized.kind === "unsupported") {
        clearTimer();
        latest = undefined;
        update({
          ...state,
          status: state.paused ? "paused" : "unsupported",
          explanation: normalized.reason,
          recommendedAction: undefined,
        });
        return;
      }
      if (normalized.kind === "heartbeat") return;
      latest = normalized;
      clearTimer();
      await publishLatest();
    },
    setPaused: (paused: boolean) => {
      clearTimer();
      update({
        ...state,
        paused,
        status: paused ? "paused" : "waiting_for_tracker",
        explanation: paused ? "Publishing is paused." : "Waiting for fresh IronMON Tracker data.",
        recommendedAction: paused ? "resume" : undefined,
      });
      if (!paused && latest) void publishLatest();
    },
    acceptDisclosure: () => {
      update({
        ...state,
        disclosureAccepted: true,
        status: state.paused ? "paused" : "waiting_for_tracker",
        explanation: state.paused
          ? "Publishing is paused."
          : "Waiting for fresh IronMON Tracker data.",
        recommendedAction: state.paused ? "resume" : "choose_tracker_folder",
      });
    },
    patchState: (patch: Partial<CompanionState>) => {
      update({ ...state, ...patch });
    },
    invalidate: (explanation: string) => {
      clearTimer();
      clearStaleTimer();
      latest = undefined;
      update({
        ...state,
        status: "action_required",
        explanation,
        recommendedAction: "choose_tracker_folder",
      });
    },
    sourceEnded: markWaiting,
    retry: () => {
      void publishLatest();
    },
    stop: () => {
      stopped = true;
      clearTimer();
      clearStaleTimer();
      listeners.clear();
    },
  };
};
