#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = process.argv[2];
const version = process.argv[3];
const publicKey = process.env.TAURI_UPDATER_PUBLIC_KEY;
if (!path || !version || !publicKey) {
  throw new Error("configuration path, version, and TAURI_UPDATER_PUBLIC_KEY are required");
}
const config = JSON.parse(await readFile(path, "utf8")) as {
  version?: string;
  plugins?: { updater?: Record<string, unknown> };
};
config.version = version;
config.plugins ??= {};
config.plugins.updater = { ...config.plugins.updater, pubkey: publicKey };
await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
