#!/usr/bin/env node
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const [directory, version, baseUrl] = process.argv.slice(2);
if (!directory || !version || !baseUrl) {
  throw new Error("usage: create-update-manifest <directory> <version> <base-url>");
}

const files = await readdir(directory, { recursive: true });
const artifactFor = (architecture: "aarch64" | "x86_64", suffix: string) => {
  const match = files.find(
    (file) => file.includes(architecture) && file.endsWith(suffix) && !file.endsWith(".sig"),
  );
  if (!match) throw new Error(`missing ${architecture} ${suffix} artifact`);
  return match;
};

const platform = async (architecture: "aarch64" | "x86_64") => {
  const archive = artifactFor(architecture, ".tar.gz");
  const signature = await readFile(path.join(directory, `${archive}.sig`), "utf8");
  return {
    signature: signature.trim(),
    url: `${baseUrl}/${path.basename(archive)}`,
  };
};

const manifest = {
  version,
  notes: "IronMON Live companion update.",
  pub_date: new Date().toISOString(),
  platforms: {
    "darwin-aarch64": await platform("aarch64"),
    "darwin-x86_64": await platform("x86_64"),
  },
};

await writeFile(path.join(directory, "latest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
