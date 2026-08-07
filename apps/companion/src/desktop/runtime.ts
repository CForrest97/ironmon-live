import { getVersion } from "@tauri-apps/api/app";
import { exit } from "@tauri-apps/plugin-process";
import { dirname, homeDir, join, resourceDir } from "@tauri-apps/api/path";
import { CheckMenuItem, Menu, MenuItem } from "@tauri-apps/api/menu";
import { TrayIcon } from "@tauri-apps/api/tray";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { disable, enable, isEnabled } from "@tauri-apps/plugin-autostart";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { confirm, message, open } from "@tauri-apps/plugin-dialog";
import {
  copyFile,
  exists,
  mkdir,
  readTextFile,
  rename,
  watch,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import { openUrl } from "@tauri-apps/plugin-opener";
import { check } from "@tauri-apps/plugin-updater";
import { parseTrackerMessage, type Publication } from "@ironmon-live/contracts";
import type { CompanionActions } from "../App";
import { defaultDesktopConfig, parseDesktopConfig } from "./config";
import { createCompanionController } from "./controller";
import { backupName, compareExtension } from "./extension";
import { initialState } from "./state";
import { trayItems } from "./tray";
import type { CompanionState, DesktopConfig } from "./types";

type Controller = ReturnType<typeof createCompanionController>;
type Runtime = {
  readonly getState: () => CompanionState;
  readonly subscribe: Controller["subscribe"];
  readonly actions: CompanionActions;
};

type PublishResponse = { readonly status: number };

const configPath = async () => join(await homeDir(), ".ironmon-live", "config.json");
const loadConfig = async (): Promise<DesktopConfig> => {
  const home = await homeDir();
  const path = await configPath();
  if (!(await exists(path))) {
    const created = defaultDesktopConfig(home);
    await saveConfig(created);
    return created;
  }
  return parseDesktopConfig(JSON.parse(await readTextFile(path)) as unknown, home);
};
const saveConfig = async (config: DesktopConfig) => {
  const path = await configPath();
  const directory = await join(await homeDir(), ".ironmon-live");
  await mkdir(directory, { recursive: true });
  const temporary = `${path}.tmp`;
  await writeTextFile(temporary, `${JSON.stringify(config, null, 2)}\n`);
  await rename(temporary, path);
};
const newChannelCode = () => {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return String((value[0] ?? 0) % 100_000).padStart(5, "0");
};

const notifyOnce = async (title: string, body: string) => {
  let granted = await isPermissionGranted();
  if (!granted) granted = (await requestPermission()) === "granted";
  if (granted) sendNotification({ title, body });
};

export const startRuntime = async (): Promise<Runtime> => {
  let config = await loadConfig();
  const sessionId = globalThis.crypto.randomUUID();
  const controller = createCompanionController({
    initialState: initialState(config, await getVersion(), await isEnabled()),
    startedAt: Date.now(),
    scheduler: {
      now: Date.now,
      setTimeout: (callback, milliseconds) => window.setTimeout(callback, milliseconds),
      clearTimeout: (id) => {
        window.clearTimeout(id);
      },
    },
    publish: async (trackerMessage) => {
      const publication: Publication = { sessionId, message: trackerMessage };
      await invoke<PublishResponse>("publish_to_live_channel", {
        request: {
          url: new URL(`/api/channels/${config.channelCode}/publish`, config.publishUrl).toString(),
          body: JSON.stringify(publication),
          occurredAt: Date.now(),
        },
      });
    },
  });

  let notifiedFailure = false;
  controller.subscribe((state) => {
    if (state.status === "offline_retrying" && !notifiedFailure && config.notifications) {
      notifiedFailure = true;
      void notifyOnce("IronMON Live is offline", "The companion will keep retrying.");
    }
    if (state.status === "live") notifiedFailure = false;
    void rebuildTray(controller, state);
  });

  const consume = async () => {
    try {
      const parsed = parseTrackerMessage(
        JSON.parse(await readTextFile(config.inputPath)) as unknown,
      );
      await controller.receive(parsed);
    } catch (error) {
      controller.invalidate(`Tracker data could not be read: ${String(error)}`);
    }
  };
  await watch(
    await dirname(config.inputPath),
    (event) => {
      if (!event.paths.includes(config.inputPath)) return;
      void exists(config.inputPath).then((present) => {
        if (present) void consume();
        else controller.sourceEnded();
      });
    },
    { delayMs: 100 },
  );
  if (await exists(config.inputPath)) void consume();

  const persist = async (patch: Partial<DesktopConfig>) => {
    config = { ...config, ...patch };
    await saveConfig(config);
  };
  const checkForUpdate = async (reportCurrent: boolean) => {
    try {
      const update = await check();
      if (!update) {
        if (reportCurrent) await message("IronMON Live is up to date.", { title: "Updates" });
        return;
      }
      const approved = await confirm(
        `${update.version} is available.${update.body ? `\n\n${update.body}` : ""}\n\nInstall it now?`,
        { title: "IronMON Live Update" },
      );
      if (approved) await update.downloadAndInstall();
    } catch (error) {
      if (reportCurrent) {
        await message(`Updates could not be checked: ${String(error)}`, {
          title: "Updates",
          kind: "error",
        });
      }
    }
  };
  const actions: CompanionActions = {
    acceptDisclosure: async () => {
      await persist({ disclosureAccepted: true });
      controller.acceptDisclosure();
    },
    chooseTrackerFolder: async () => {
      try {
        const selected = await open({
          directory: true,
          multiple: false,
          title: "Choose Tracker Extension Folder",
        });
        if (!selected) return;
        const bundledPath = await join(await resourceDir(), "IronMONLive.lua");
        const installedPath = await join(selected, "IronMONLive.lua");
        const bundled = await readTextFile(bundledPath);
        const installed = (await exists(installedPath))
          ? await readTextFile(installedPath)
          : undefined;
        const comparison = compareExtension(bundled, installed);
        if (comparison === "different") {
          const approved = await confirm(
            "A different IronMONLive.lua already exists. Back it up and install this version?",
            { title: "Update Tracker Extension", kind: "warning" },
          );
          if (!approved) return;
          await copyFile(installedPath, await join(selected, backupName(new Date())));
        }
        if (comparison !== "current") {
          const temporary = await join(selected, ".IronMONLive.lua.tmp");
          await writeTextFile(temporary, bundled);
          await rename(temporary, installedPath);
        }
        await persist({ trackerExtensionDirectory: selected });
        controller.patchState({
          trackerExtensionDirectory: selected,
          trackerExtensionStatus: "current",
          explanation: "Tracker extension installed. Waiting for fresh Tracker data.",
          status: "waiting_for_tracker",
        });
      } catch (error) {
        controller.patchState({
          trackerExtensionStatus: "unknown",
          status: "action_required",
          explanation: `The Tracker extension could not be installed: ${String(error)}`,
          recommendedAction: "choose_tracker_folder",
        });
      }
    },
    setPaused: async (paused) => {
      await persist({ paused });
      controller.setPaused(paused);
    },
    setStartAtLogin: async (enabled) => {
      await (enabled ? enable() : disable());
      controller.patchState({ startAtLogin: enabled });
    },
    openLiveView: async () => openUrl(`${config.publishUrl}/channel/${config.channelCode}`),
    copyChannelCode: async () => writeText(config.channelCode),
    copyPublishDiagnostics: async () => {
      try {
        const diagnostics = await readTextFile(
          await join(await homeDir(), ".ironmon-live", "publish-diagnostics.jsonl"),
        );
        await writeText(diagnostics);
        await message("Publish diagnostics copied to your clipboard.", { title: "Diagnostics" });
      } catch {
        await message("No publish diagnostics have been saved yet.", { title: "Diagnostics" });
      }
    },
    checkForUpdates: () => checkForUpdate(true),
    resetChannelCode: async () => {
      const approved = await confirm(
        "Resetting changes your live channel and cannot be undone. Continue?",
        { title: "Reset Channel Code", kind: "warning" },
      );
      if (!approved) return;
      await persist({ channelCode: newChannelCode() });
      globalThis.location.reload();
    },
  };
  runtimeActions = actions;
  window.setTimeout(() => void checkForUpdate(false), 5_000);
  return { getState: controller.getState, subscribe: controller.subscribe, actions };
};

let tray: TrayIcon | undefined;
let runtimeActions: CompanionActions | undefined;
const rebuildTray = async (controller: Controller, state: CompanionState) => {
  const items = await Promise.all(
    trayItems(state).map(async (item) =>
      item.id === "autostart"
        ? CheckMenuItem.new({
            id: item.id,
            text: item.text,
            checked: item.checked,
            action: (id) => void handleTrayAction(controller, id),
          })
        : MenuItem.new({
            id: item.id,
            text: item.text,
            enabled: item.enabled,
            action: (id) => void handleTrayAction(controller, id),
          }),
    ),
  );
  const menu = await Menu.new({ items });
  if (!tray) {
    tray = await TrayIcon.new({
      id: "main",
      menu,
      showMenuOnLeftClick: true,
      title: "●",
      tooltip: "IronMON Live",
    });
  } else {
    await tray.setMenu(menu);
  }
};

const handleTrayAction = async (controller: Controller, id: string) => {
  const runtimeState = controller.getState();
  if (id === "open-live") await runtimeActions?.openLiveView();
  if (id === "copy-code") await runtimeActions?.copyChannelCode();
  if (id === "pause") await runtimeActions?.setPaused(!runtimeState.paused);
  if (id === "settings") {
    await getCurrentWindow().show();
    await getCurrentWindow().setFocus();
  }
  if (id === "update") await runtimeActions?.checkForUpdates();
  if (id === "autostart") await runtimeActions?.setStartAtLogin(!runtimeState.startAtLogin);
  if (id === "quit") await exit(0);
};
