import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateWorkflows } from "../scripts/validate-workflows.ts";

function createWorkflowRepository(workflow: string, filename = "quality.yml"): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ironmon-workflow-"));
  fs.mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
  fs.writeFileSync(path.join(root, `.github/workflows/${filename}`), workflow);
  if (filename !== "quality.yml") {
    fs.writeFileSync(path.join(root, ".github/workflows/quality.yml"), validWorkflow);
  }
  return root;
}

const validWorkflow = `name: Quality
on:
  pull_request:
permissions:
  contents: read
jobs:
  quality:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
        with:
          persist-credentials: false
      - run: npm run check
`;

test("accepts a minimal secure quality workflow", () => {
  assert.deepEqual(
    validateWorkflows(createWorkflowRepository(validWorkflow), { requireAgentSystem: false })
      .errors,
    [],
  );
});

test("rejects actions that are not pinned to a full SHA", () => {
  const root = createWorkflowRepository(
    validWorkflow.replace(
      "actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd",
      "actions/checkout@v6",
    ),
  );
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("full commit SHA"),
    ),
  );
});

test("rejects third-party actions missing from the selected-action policy", () => {
  const root = createWorkflowRepository(
    validWorkflow.replace(
      "actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd",
      "example/setup@de0fac2e4500dabe0009e67214ff5f5447ce83dd",
    ),
  );
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("selected-actions.json"),
    ),
  );
});

test("accepts pinned third-party actions in the selected-action policy", () => {
  const root = createWorkflowRepository(
    validWorkflow.replace(
      "actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd",
      "example/setup@de0fac2e4500dabe0009e67214ff5f5447ce83dd",
    ),
  );
  fs.writeFileSync(
    path.join(root, ".github/selected-actions.json"),
    JSON.stringify({ patterns_allowed: ["example/setup@*"] }),
  );
  assert.deepEqual(validateWorkflows(root, { requireAgentSystem: false }).errors, []);
});

test("requires the deployment workflow to run on pushes to main", () => {
  const root = createWorkflowRepository(
    validWorkflow.replace("name: Quality", "name: Deploy application"),
    "deploy.yml",
  );
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("pushes to main"),
    ),
  );
});

test("requires manual infrastructure apply to use the main branch", () => {
  const infrastructureWorkflow = `name: Infrastructure
on:
  workflow_dispatch:
  pull_request:
  push:
    branches:
      - main
permissions:
  contents: read
jobs:
  plan:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd
        with:
          persist-credentials: false
      - if: github.event_name == 'push'
        run: tofu -chdir=infra apply production.tfplan
`;
  const root = createWorkflowRepository(infrastructureWorkflow, "infrastructure.yml");
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("main-branch workflow dispatch only"),
    ),
  );

  fs.writeFileSync(
    path.join(root, ".github/workflows/infrastructure.yml"),
    infrastructureWorkflow
      .replace("  workflow_dispatch:\n", "")
      .replace(
        "github.event_name == 'push'",
        "github.event_name == 'push' || (github.event_name == 'workflow_dispatch' && github.ref == 'refs/heads/main')",
      ),
  );
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("manual recovery requires workflow_dispatch"),
    ),
  );
});

test("rejects pull_request_target", () => {
  const root = createWorkflowRepository(
    validWorkflow.replace("pull_request:", "pull_request_target:"),
  );
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("pull_request_target"),
    ),
  );
});

test("rejects JavaScript repository scripts", () => {
  const root = createWorkflowRepository(validWorkflow);
  fs.mkdirSync(path.join(root, "scripts"));
  fs.writeFileSync(path.join(root, "scripts/example.mjs"), "export {};\n");
  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("use TypeScript"),
    ),
  );
});

test("allows shell scripts that orchestrate commands", () => {
  const root = createWorkflowRepository(validWorkflow);
  fs.mkdirSync(path.join(root, "scripts"));
  fs.writeFileSync(
    path.join(root, "scripts/configure.sh"),
    "#!/usr/bin/env bash\nset -euo pipefail\ngh auth status\n",
  );
  assert.deepEqual(validateWorkflows(root, { requireAgentSystem: false }).errors, []);
});

test("rejects the nonexistent Tauri HTTP scope permission", () => {
  const root = createWorkflowRepository(validWorkflow);
  const capabilityDirectory = path.join(root, "apps/companion/src-tauri/capabilities");
  fs.mkdirSync(capabilityDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(capabilityDirectory, "default.json"),
    JSON.stringify({ permissions: [{ identifier: "http:scope", allow: [] }] }),
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("HTTP URL scope must be attached to http:allow-fetch"),
    ),
  );
});

test("rejects missing Tauri bundle resources", () => {
  const root = createWorkflowRepository(validWorkflow);
  const tauriDirectory = path.join(root, "apps/companion/src-tauri");
  fs.mkdirSync(path.join(tauriDirectory, "capabilities"), { recursive: true });
  fs.writeFileSync(
    path.join(tauriDirectory, "capabilities/default.json"),
    JSON.stringify({ permissions: [] }),
  );
  fs.writeFileSync(
    path.join(tauriDirectory, "tauri.conf.json"),
    JSON.stringify({ bundle: { resources: { "../missing.lua": "missing.lua" } } }),
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("resource path does not exist: ../missing.lua"),
    ),
  );
});

test("requires the repository skills and custom reviewer", () => {
  const root = createWorkflowRepository(validWorkflow);
  assert(
    validateWorkflows(root).errors.some((error) => error.includes("required agent-system file")),
  );
});
