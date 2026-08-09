/**
 * Captures the scenes and hands them to Claude Code for a visual review.
 *
 * The rubric lives in `.agents/skills/visual-review/SKILL.md` rather than in
 * this file, so the same wording governs a scripted run and an interactive one.
 */

import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { hasFlag, readValue, readValues } from "./args.ts";
import type { Manifest } from "./manifest.ts";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const skillPath = ".agents/skills/visual-review/SKILL.md";

const passedArguments = process.argv.slice(2);

const run = (command: string, commandArguments: readonly string[], captureStdout: boolean) =>
  new Promise<string>((resolve, reject) => {
    const child = spawn(command, [...commandArguments], {
      cwd: repositoryRoot,
      stdio: ["ignore", captureStdout ? "pipe" : "inherit", "inherit"],
    });
    let output = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      output += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(output);
      else reject(new Error(`${command} exited with status ${String(code ?? "unknown")}`));
    });
  });

const capture = async () => {
  // Normalize to `--flag=value` for the child process regardless of which
  // form (`--flag value` or `--flag=value`) the caller used.
  const out = readValue(passedArguments, "--out");
  const baseUrl = readValue(passedArguments, "--base-url");
  const forwarded = [
    ...readValues(passedArguments, "--scene").map((value) => `--scene=${value}`),
    ...readValues(passedArguments, "--viewport").map((value) => `--viewport=${value}`),
    ...(out ? [`--out=${out}`] : []),
    ...(baseUrl ? [`--base-url=${baseUrl}`] : []),
  ];
  const output = await run("node", ["apps/web/visual/capture.ts", ...forwarded], true);
  const directory = output.trim().split("\n").at(-1);
  if (!directory) throw new Error("the capture did not report an output directory");
  return directory;
};

const promptFor = (directory: string, manifest: string) => `
Review the IronMON Live screenshots in ${directory} against the rubric in ${skillPath}.

Read ${skillPath} first and follow it exactly, including its output format.

${directory}/manifest.json lists every capture with the measured geometry of its
landmarks. Read it before the images and use it for anything measurable —
alignment, spacing, above-the-fold placement, overflow. Read every PNG it names.

The manifest describes these captures:
${manifest}
`;

const main = async () => {
  const directory = hasFlag(passedArguments, "--skip-capture")
    ? path.resolve(
        repositoryRoot,
        readValue(passedArguments, "--out") ?? "apps/web/test-results/visual",
      )
    : await capture();

  const manifest = JSON.parse(
    await readFile(path.join(directory, "manifest.json"), "utf8"),
  ) as Manifest;

  const summary = manifest.captures
    .map((record) => {
      const size = `${String(record.viewport.width)}x${String(record.viewport.height)} CSS px`;
      const files = record.images.map((image) => image.file).join(", ");
      return `- ${record.scene} at ${record.viewport.name} (${size}): ${files}`;
    })
    .join("\n");

  const model = readValue(passedArguments, "--model");
  const effort = readValue(passedArguments, "--effort");
  const claudeArguments = [
    "-p",
    promptFor(directory, summary),
    "--allowed-tools",
    "Read,Glob,Grep",
    ...(model ? ["--model", model] : []),
    ...(effort ? ["--effort", effort] : []),
  ];

  console.error(`reviewing ${String(manifest.captures.length)} views with claude`);
  const review = await run("claude", claudeArguments, true);
  const reviewPath = path.join(directory, "review.md");
  await writeFile(reviewPath, review.endsWith("\n") ? review : `${review}\n`);
  process.stdout.write(review);
  console.error(`\nreview written to ${reviewPath}`);
};

await main();
