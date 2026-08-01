#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { parse as parseYaml } from "yaml";

type UnknownRecord = Record<string, unknown>;

export type WorkflowValidationResult = {
  errors: string[];
  workflowCount: number;
};

type WorkflowValidationOptions = {
  requireAgentSystem?: boolean;
};

function asRecord(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function workflowFiles(root: string): string[] {
  const directory = path.join(root, ".github/workflows");
  if (!fs.existsSync(directory)) return [];
  return fs
    .readdirSync(directory)
    .filter((name) => /\.ya?ml$/u.test(name))
    .map((name) => path.join(directory, name))
    .sort();
}

function selectedActionPatterns(root: string): string[] {
  const policyPath = path.join(root, ".github/selected-actions.json");
  if (!fs.existsSync(policyPath)) return [];
  const policy = asRecord(JSON.parse(fs.readFileSync(policyPath, "utf8")));
  return policy && Array.isArray(policy.patterns_allowed)
    ? policy.patterns_allowed.filter((pattern): pattern is string => typeof pattern === "string")
    : [];
}

function actionMatchesPattern(action: string, pattern: string): boolean {
  return pattern.endsWith("*") ? action.startsWith(pattern.slice(0, -1)) : action === pattern;
}

function validateScriptLanguagePreference(root: string, errors: string[]): void {
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

function validateGeneratedOutputIgnores(root: string, errors: string[]): void {
  const eslintConfigPath = path.join(root, "eslint.config.ts");
  if (
    fs.existsSync(eslintConfigPath) &&
    !fs.readFileSync(eslintConfigPath, "utf8").includes('"apps/companion/src-tauri/target/**"')
  ) {
    errors.push("eslint.config.ts: Tauri build output must be ignored");
  }
}

function validateTauriCapabilities(root: string, errors: string[]): void {
  const cargoPath = path.join(root, "apps/companion/src-tauri/Cargo.toml");
  const libraryPath = path.join(root, "apps/companion/src-tauri/src/lib.rs");
  if (fs.existsSync(cargoPath) && fs.existsSync(libraryPath)) {
    const cargo = fs.readFileSync(cargoPath, "utf8");
    const library = fs.readFileSync(libraryPath, "utf8");
    const dependencies =
      /^\[dependencies\]\s*$([\s\S]*?)(?=^\[|(?![\s\S]))/mu.exec(cargo)?.[1] ?? "";
    if (library.includes("tauri::generate_context!()") && !/^serde_json\s*=/mu.test(dependencies)) {
      errors.push(
        "apps/companion/src-tauri/Cargo.toml: serde_json must be a direct dependency for tauri::generate_context!()",
      );
    }
  }

  const capabilityPath = path.join(root, "apps/companion/src-tauri/capabilities/default.json");
  if (fs.existsSync(capabilityPath)) {
    const capability = asRecord(JSON.parse(fs.readFileSync(capabilityPath, "utf8")));
    const permissions = Array.isArray(capability?.permissions) ? capability.permissions : [];
    const identifiers = permissions.flatMap((permission) => {
      if (typeof permission === "string") return [permission];
      const identifier = asRecord(permission)?.identifier;
      return typeof identifier === "string" ? [identifier] : [];
    });
    if (identifiers.includes("http:scope")) {
      errors.push(
        "apps/companion/src-tauri/capabilities/default.json: HTTP URL scope must be attached to http:allow-fetch",
      );
    }
  }

  const configPath = path.join(root, "apps/companion/src-tauri/tauri.conf.json");
  if (!fs.existsSync(configPath)) return;
  const config = asRecord(JSON.parse(fs.readFileSync(configPath, "utf8")));
  const bundle = asRecord(config?.bundle);
  const targets = Array.isArray(bundle?.targets) ? bundle.targets : [];
  if (bundle?.createUpdaterArtifacts === true && !targets.includes("app")) {
    errors.push(
      "apps/companion/src-tauri/tauri.conf.json: macOS updater artifacts require the app bundle target",
    );
  }
  const resources = asRecord(bundle?.resources);
  for (const resourcePath of Object.keys(resources ?? {})) {
    if (!fs.existsSync(path.resolve(path.dirname(configPath), resourcePath))) {
      errors.push(
        `apps/companion/src-tauri/tauri.conf.json: resource path does not exist: ${resourcePath}`,
      );
    }
  }

  const icons = Array.isArray(bundle?.icon)
    ? bundle.icon.filter((icon): icon is string => typeof icon === "string")
    : [];
  if (icons.length === 0) {
    errors.push("apps/companion/src-tauri/tauri.conf.json: bundle icons must be configured");
  }
  for (const iconPath of icons) {
    if (!fs.existsSync(path.resolve(path.dirname(configPath), iconPath))) {
      errors.push(
        `apps/companion/src-tauri/tauri.conf.json: bundle icon does not exist: ${iconPath}`,
      );
    }
  }
}

function validateAgentReviewSystem(root: string, errors: string[]): void {
  const required = [
    ".agents/skills/review-change/SKILL.md",
    ".agents/skills/review-change/agents/openai.yaml",
    ".agents/skills/typescript-expert/SKILL.md",
    ".agents/skills/typescript-expert/agents/openai.yaml",
    ".codex/agents/risk-reviewer.toml",
  ];
  for (const relative of required) {
    if (!fs.existsSync(path.join(root, relative)))
      errors.push(`${relative}: required agent-system file is missing`);
  }

  const agentsPath = path.join(root, "AGENTS.md");
  if (fs.existsSync(agentsPath)) {
    const guidance = fs.readFileSync(agentsPath, "utf8");
    for (const heading of ["## Learned rules", "## Independent review gate"]) {
      if (!guidance.includes(heading)) errors.push(`AGENTS.md: missing ${heading}`);
    }
    if (/\bLRN-\d{3}\b/u.test(guidance))
      errors.push("AGENTS.md: heavyweight learning-record references are not allowed");
  }

  const skillPath = path.join(root, ".agents/skills/review-change/SKILL.md");
  if (fs.existsSync(skillPath)) {
    const skill = fs.readFileSync(skillPath, "utf8");
    for (const field of [
      "REVIEW_RATING",
      "REVIEW_CONFIDENCE",
      "HUMAN_APPROVAL_REQUIRED",
      "BLOCKING_FINDINGS",
    ]) {
      if (!skill.includes(field)) errors.push(`review-change skill: missing output field ${field}`);
    }
  }

  const reviewerPath = path.join(root, ".codex/agents/risk-reviewer.toml");
  if (fs.existsSync(reviewerPath)) {
    const reviewer = fs.readFileSync(reviewerPath, "utf8");
    if (!/^model\s*=\s*"gpt-5\.6-terra"$/mu.test(reviewer))
      errors.push("risk reviewer: must pin the independent reviewer model");
    if (!/^model_reasoning_effort\s*=\s*"high"$/mu.test(reviewer))
      errors.push("risk reviewer: reasoning effort must be high");
    if (!/^sandbox_mode\s*=\s*"read-only"$/mu.test(reviewer))
      errors.push("risk reviewer: sandbox must be read-only");
    if (!reviewer.includes("$review-change"))
      errors.push("risk reviewer: must invoke the review-change skill");
  }

  const typescriptSkillPath = path.join(root, ".agents/skills/typescript-expert/SKILL.md");
  if (fs.existsSync(typescriptSkillPath)) {
    const skill = fs.readFileSync(typescriptSkillPath, "utf8");
    for (const preference of [
      "`type` aliases",
      "Arrow functions",
      "Functional transformations",
      "Prettier",
      "type-aware ESLint",
    ]) {
      if (!skill.includes(preference))
        errors.push(`typescript-expert skill: missing guidance for ${preference}`);
    }
    if (!skill.includes("without treating preferences as absolute rules")) {
      errors.push("typescript-expert skill: must state that coding preferences allow exceptions");
    }
  }
}

export function validateWorkflows(
  root: string,
  options: WorkflowValidationOptions = {},
): WorkflowValidationResult {
  const errors: string[] = [];
  const files = workflowFiles(root);
  const allowedActionPatterns = selectedActionPatterns(root);
  validateScriptLanguagePreference(root, errors);
  validateGeneratedOutputIgnores(root, errors);
  validateTauriCapabilities(root, errors);
  if (options.requireAgentSystem !== false) validateAgentReviewSystem(root, errors);

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
    if (
      !permissions ||
      permissions.contents !== "read" ||
      Object.keys(permissions).some((key) => key !== "contents")
    ) {
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
          const action = step.uses;
          if (!/^[^@\s]+@[0-9a-f]{40}$/u.test(action)) {
            errors.push(
              `${relative}: job ${jobName} step ${String(index + 1)} must pin uses to a full commit SHA`,
            );
          }
          if (action.startsWith("actions/setup-go@")) {
            errors.push(`${relative}: Go setup is not allowed for repository tooling`);
          }
          if (
            !action.startsWith("actions/") &&
            !allowedActionPatterns.some((pattern) => actionMatchesPattern(action, pattern))
          ) {
            errors.push(
              `${relative}: job ${jobName} step ${String(index + 1)} action is missing from .github/selected-actions.json`,
            );
          }
          if (action.startsWith("actions/checkout@")) {
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

  const deployPath = path.join(root, ".github/workflows/deploy.yml");
  if (fs.existsSync(deployPath)) {
    const deploy = asRecord(parseYaml(fs.readFileSync(deployPath, "utf8")));
    const triggers = asRecord(deploy?.on);
    const push = asRecord(triggers?.push);
    if (!Array.isArray(push?.branches) || !push.branches.includes("main")) {
      errors.push(".github/workflows/deploy.yml: deployment must run on pushes to main");
    }
  }

  const infrastructurePath = path.join(root, ".github/workflows/infrastructure.yml");
  if (fs.existsSync(infrastructurePath)) {
    const infrastructure = asRecord(parseYaml(fs.readFileSync(infrastructurePath, "utf8")));
    const triggers = asRecord(infrastructure?.on);
    if (!triggers || !Object.hasOwn(triggers, "workflow_dispatch")) {
      errors.push(
        ".github/workflows/infrastructure.yml: manual recovery requires workflow_dispatch",
      );
    }
    const jobs = asRecord(infrastructure?.jobs);
    const applyStep = Object.values(jobs ?? {})
      .flatMap((job) => {
        const steps = asRecord(job)?.steps;
        return Array.isArray(steps) ? (steps as unknown[]) : [];
      })
      .map(asRecord)
      .find(
        (step) => typeof step?.run === "string" && step.run.includes("tofu -chdir=infra apply"),
      );
    if (
      applyStep?.if !==
      "github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main')"
    ) {
      errors.push(
        ".github/workflows/infrastructure.yml: apply must run for pushes or main-branch workflow dispatch only",
      );
    }
  }

  const releasePath = path.join(root, ".github/workflows/release-companion.yml");
  if (fs.existsSync(releasePath)) {
    const release = fs.readFileSync(releasePath, "utf8");
    if (!release.includes("secrets.CLOUDFLARE_DEPLOY_API_TOKEN")) {
      errors.push(
        ".github/workflows/release-companion.yml: R2 publication must use CLOUDFLARE_DEPLOY_API_TOKEN",
      );
    }
    if (!release.includes("wrangler r2 object put")) {
      errors.push(".github/workflows/release-companion.yml: R2 publication must use Wrangler");
    }
    if (/R2_RELEASE_(?:ACCESS_KEY_ID|SECRET_ACCESS_KEY)|aws s3/u.test(release)) {
      errors.push(
        ".github/workflows/release-companion.yml: R2 publication must not use AWS-style credentials or commands",
      );
    }
  }

  return { errors: [...new Set(errors)].sort(), workflowCount: files.length };
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  const result = validateWorkflows(process.cwd());
  if (result.errors.length > 0) {
    console.error(`Workflow validation failed with ${String(result.errors.length)} error(s):`);
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Workflow validation passed (${String(result.workflowCount)} workflow(s)).`);
  }
}
