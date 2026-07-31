#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

const repositoryName = "ironmon-live";
const owner = process.argv[2];

if (!owner) {
  console.error("Usage: npm run configure:github -- GITHUB_OWNER");
  process.exit(2);
}

function execute(command: string, args: string[], capture = false): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    if (capture && result.stderr) console.error(result.stderr.trim());
    throw new Error(`${command} exited with status ${String(result.status)}`);
  }
  return capture ? result.stdout.trim() : "";
}

function succeeds(command: string, args: string[]): boolean {
  const result = spawnSync(command, args, { stdio: "ignore" });
  return result.status === 0;
}

const repository = `${owner}/${repositoryName}`;
execute("gh", ["auth", "status"]);

if (!succeeds("gh", ["repo", "view", repository])) {
  execute("gh", [
    "repo",
    "create",
    repository,
    "--public",
    "--description",
    "Product-first, agentic development of IronMON Live",
  ]);
}

if (!succeeds("git", ["remote", "get-url", "origin"])) {
  execute("git", ["remote", "add", "origin", `https://github.com/${repository}.git`]);
}

const apiVersion = ["-H", "X-GitHub-Api-Version: 2026-03-10"];
execute("gh", [
  "api",
  "--method",
  "PATCH",
  ...apiVersion,
  `repos/${repository}`,
  "-F",
  "allow_squash_merge=true",
  "-F",
  "allow_merge_commit=false",
  "-F",
  "allow_rebase_merge=false",
  "-F",
  "has_issues=false",
  "-F",
  "delete_branch_on_merge=true",
], true);

for (const [endpoint, input] of [
  ["actions/permissions", ".github/actions-permissions.json"],
  ["actions/permissions/selected-actions", ".github/selected-actions.json"],
  ["actions/permissions/workflow", ".github/workflow-permissions.json"],
] as const) {
  execute("gh", ["api", "--method", "PUT", ...apiVersion, `repos/${repository}/${endpoint}`, "--input", input], true);
}

let successfulRuns = 0;
if (succeeds("gh", ["workflow", "view", "quality.yml", "--repo", repository])) {
  const output = execute("gh", [
    "run",
    "list",
    "--repo",
    repository,
    "--workflow",
    "quality.yml",
    "--branch",
    "main",
    "--status",
    "success",
    "--limit",
    "1",
    "--json",
    "databaseId",
    "--jq",
    "length",
  ], true);
  successfulRuns = Number(output);
}

if (successfulRuns === 0) {
  console.error("Remote settings applied, but the main ruleset was not created.");
  console.error("Push main, wait for Quality to pass, then run this command again.");
  process.exit(3);
}

const rulesetId = execute("gh", [
  "api",
  ...apiVersion,
  `repos/${repository}/rulesets`,
  "--jq",
  '.[] | select(.name == "main") | .id',
], true).split("\n")[0];

if (rulesetId) {
  execute("gh", [
    "api",
    "--method",
    "PUT",
    ...apiVersion,
    `repos/${repository}/rulesets/${rulesetId}`,
    "--input",
    ".github/rulesets/main.json",
  ], true);
} else {
  execute("gh", [
    "api",
    "--method",
    "POST",
    ...apiVersion,
    `repos/${repository}/rulesets`,
    "--input",
    ".github/rulesets/main.json",
  ], true);
}

console.log(`Configured https://github.com/${repository}`);
