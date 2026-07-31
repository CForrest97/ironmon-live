import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateWorkflows } from "../scripts/validate-workflows.ts";

function createWorkflowRepository(workflow: string): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ironmon-workflow-"));
  fs.mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
  fs.writeFileSync(path.join(root, ".github/workflows/quality.yml"), workflow);
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

test("requires the repository skills and custom reviewer", () => {
  const root = createWorkflowRepository(validWorkflow);
  assert(
    validateWorkflows(root).errors.some((error) => error.includes("required agent-system file")),
  );
});
