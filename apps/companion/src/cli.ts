#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import { resolve } from "node:path";
import { isChannelCode } from "@ironmon-live/contracts";
import { defaultConfigPath, loadConfig, resetChannelCode, saveConfig } from "./config.js";
import { createPublisher } from "./publisher.js";
import { watchSnapshots } from "./watcher.js";

const valueAfter = (args: readonly string[], flag: string) => {
  const index = args.indexOf(flag);
  return index < 0 ? undefined : args[index + 1];
};

const main = async () => {
  const args = process.argv.slice(2);
  const configPath = resolve(valueAfter(args, "--config") ?? defaultConfigPath);

  if (args.includes("reset-code")) {
    process.stdout.write(`${await resetChannelCode(configPath)}\n`);
    return;
  }

  const stored = await loadConfig(configPath);
  const config = {
    ...stored,
    inputPath: resolve(valueAfter(args, "--input") ?? stored.inputPath),
    publishUrl: valueAfter(args, "--url") ?? stored.publishUrl,
    channelCode: valueAfter(args, "--channel") ?? stored.channelCode,
  };
  if (!isChannelCode(config.channelCode)) {
    throw new Error("--channel must be exactly five digits");
  }
  new URL(config.publishUrl);
  await saveConfig(configPath, config);

  if (args.includes("show-code")) {
    process.stdout.write(`${config.channelCode}\n`);
    return;
  }

  const publish = createPublisher({
    baseUrl: config.publishUrl,
    channelCode: config.channelCode,
    sessionId: randomUUID(),
  });
  await publish({
    kind: "unsupported",
    schemaVersion: 1,
    observedAt: new Date().toISOString(),
    reason: "waiting for a current-session Tracker snapshot",
  });
  process.stdout.write(`IronMON Live channel ${config.channelCode}\n`);
  process.stdout.write(`Watching ${config.inputPath}\n`);
  watchSnapshots({
    path: config.inputPath,
    onMessage: publish,
    onError: async (error) => {
      process.stderr.write(`${String(error)}\n`);
      await publish({
        kind: "unsupported",
        schemaVersion: 1,
        observedAt: new Date().toISOString(),
        reason: "invalid Tracker input",
      });
    },
  });
};

await main();
