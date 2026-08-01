#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";

const path = process.argv[2];
const version = process.argv[3];
const releaseMetadataPath = process.argv[4];
const publicKey = process.env.TAURI_UPDATER_PUBLIC_KEY;
if (!path || !version || !releaseMetadataPath || !publicKey) {
  throw new Error(
    "configuration path, version, release metadata path, and TAURI_UPDATER_PUBLIC_KEY are required",
  );
}
const releaseMetadata = JSON.parse(await readFile(releaseMetadataPath, "utf8")) as {
  version?: string;
};
if (releaseMetadata.version !== version) {
  throw new Error(
    `release tag ${version} does not match website companion version ${String(releaseMetadata.version)}`,
  );
}
const config = JSON.parse(await readFile(path, "utf8")) as {
  version?: string;
  plugins?: { updater?: Record<string, unknown> };
};
config.version = version;
config.plugins ??= {};
config.plugins.updater = { ...config.plugins.updater, pubkey: publicKey };
await writeFile(path, `${JSON.stringify(config, null, 2)}\n`);
