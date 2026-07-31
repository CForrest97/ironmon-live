#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parse as parseYaml } from "yaml";

type UnknownRecord = Record<string, unknown>;

export interface WorkflowValidationResult {
  errors: string[];
  workflowCount: number;
}

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function workflowFiles(root: string): string[] {
  const directory = path.join(root, ".github/workflows");
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((name) => /\.ya?ml$/u.test(name))
    .map((name) => path.join(directory, name))
    .sort();
}

function validateTypeScriptPreference(root: string, errors: string[]): void {
  for (const directoryName of ["scripts", "test"]) {
    const directory = path.join(root, directoryName);
    if (!fs.existsSync(directory)) continue;
    const pending = [directory];
    while (pending.length > 0) {
      const current = pending.pop();
      if (!current) continue;
      for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
        const absolute = path.join(current, entry.name);
        if (entry.isDirectory()) pending.push(absolute);
        if (entry.isFile() && /\.(?:js|jsx|mjs|cjs)$/u.test(entry.name)) {
          errors.push(`${path.relative(root, absolute)}: use TypeScript for repository code`);
        }
      }
    }
  }
}

export function validateWorkflows(root: string): WorkflowValidationResult {
  const errors: string[] = [];
  const files = workflowFiles(root);
  validateTypeScriptPreference(root, errors);

  for (const absolute of files) {
    const relative = path.relative(root, absolute);
    let workflow: UnknownRecord | null;
    try {
      workflow = asRecord(parseYaml(fs.readFileSync(absolute, "utf8")));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${relative}: invalid YAML: ${message}`);
      continue;
    }
    if (!workflow) {
      errors.push(`${relative}: workflow must be a YAML mapping`);
      continue;
    }

    const triggers = asRecord(workflow.on);
    if (triggers && Object.hasOwn(triggers, "pull_request_target")) {
      errors.push(`${relative}: pull_request_target is not allowed`);
    }

    const permissions = asRecord(workflow.permissions);
    if (!permissions || permissions.contents !== "read" || Object.keys(permissions).some((key) => key !== "contents")) {
      errors.push(`${relative}: top-level permissions must contain only "contents: read"`);
    }

    const jobs = asRecord(workflow.jobs);
    if (!jobs || Object.keys(jobs).length === 0) {
      errors.push(`${relative}: workflow must define at least one job`);
      continue;
    }

    for (const [jobName, rawJob] of Object.entries(jobs)) {
      const job = asRecord(rawJob);
      if (!job) {
        errors.push(`${relative}: job ${jobName} must be a mapping`);
        continue;
      }
      if (typeof job["timeout-minutes"] !== "number" || job["timeout-minutes"] <= 0) {
        errors.push(`${relative}: job ${jobName} must set a positive timeout-minutes`);
      }
      const steps = Array.isArray(job.steps) ? job.steps : [];
      for (const [index, rawStep] of steps.entries()) {
        const step = asRecord(rawStep);
        if (!step) continue;
        if (typeof step.uses === "string" && !step.uses.startsWith("./")) {
          if (!/^[^@\s]+@[0-9a-f]{40}$/u.test(step.uses)) {
            errors.push(`${relative}: job ${jobName} step ${index + 1} must pin uses to a full commit SHA`);
          }
          if (step.uses.startsWith("actions/setup-go@")) {
            errors.push(`${relative}: Go setup is not allowed for repository tooling`);
          }
          if (step.uses.startsWith("actions/checkout@")) {
            const inputs = asRecord(step.with);
            if (!inputs || inputs["persist-credentials"] !== false) {
              errors.push(`${relative}: checkout must set persist-credentials to false`);
            }
          }
        }
        if (typeof step.run === "string" && /curl[^\n]*\|\s*(?:ba)?sh/u.test(step.run)) {
          errors.push(`${relative}: piping downloaded content to a shell is not allowed`);
        }
      }
    }
  }

  const qualityPath = path.join(root, ".github/workflows/quality.yml");
  if (!fs.existsSync(qualityPath)) {
    errors.push(".github/workflows/quality.yml: required quality workflow is missing");
  } else if (!fs.readFileSync(qualityPath, "utf8").includes("npm run check")) {
    errors.push(".github/workflows/quality.yml: quality workflow must run npm run check");
  }

  return { errors: [...new Set(errors)].sort(), workflowCount: files.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = validateWorkflows(process.cwd());
  if (result.errors.length > 0) {
    console.error(`Workflow validation failed with ${result.errors.length} error(s):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Workflow validation passed (${result.workflowCount} workflow(s)).`);
  }
}
