#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

function markdownFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules", "test"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...markdownFiles(absolute));
    if (entry.isFile() && entry.name.endsWith(".md")) files.push(absolute);
  }
  return files;
}

const sources = new Map<string, Set<string>>();
const linkPattern = /!?\[[^\]]*\]\((https?:\/\/[^)\s]+)(?:\s+["'][^"']*["'])?\)/gu;
for (const file of markdownFiles(process.cwd())) {
  const relative = path.relative(process.cwd(), file);
  for (const match of fs.readFileSync(file, "utf8").matchAll(linkPattern)) {
    const url = match[1]?.replace(/[.,;:]$/u, "");
    if (!url) continue;
    if (!sources.has(url)) sources.set(url, new Set<string>());
    sources.get(url)?.add(relative);
  }
}

async function request(url: string): Promise<string | null> {
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      const response = await fetch(url, {
        method: "GET",
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: { "user-agent": "ironmon-live-link-checker/1.0" },
      });
      await response.body?.cancel();
      if (response.ok || response.status === 429) return null;
      if (attempt === 2) return `HTTP ${String(response.status)}`;
    } catch (error) {
      if (attempt === 2) return error instanceof Error ? error.message : String(error);
    }
  }
  return "unknown failure";
}

const failures: string[] = [];
const links = [...sources.keys()].sort();
for (let index = 0; index < links.length; index += 5) {
  const batch = links.slice(index, index + 5);
  const results = await Promise.all(
    batch.map(async (url): Promise<[string, string | null]> => [url, await request(url)]),
  );
  for (const [url, error] of results) {
    if (error)
      failures.push(`${url} (${error}) referenced by ${[...(sources.get(url) ?? [])].join(", ")}`);
  }
}

if (failures.length > 0) {
  console.error(`External link check failed with ${String(failures.length)} error(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`External link check passed (${String(links.length)} unique URL(s)).`);
}
