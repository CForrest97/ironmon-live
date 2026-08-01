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

test("requires companion releases to publish through Wrangler with the deploy token", () => {
  const releaseWorkflow = validWorkflow.replace("name: Quality", "name: Release companion").replace(
    "      - run: npm run check",
    `      - run: aws s3 cp release artifact
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.R2_RELEASE_ACCESS_KEY_ID }}`,
  );
  const root = createWorkflowRepository(releaseWorkflow, "release-companion.yml");
  const errors = validateWorkflows(root, { requireAgentSystem: false }).errors;

  assert(errors.some((error) => error.includes("must use CLOUDFLARE_DEPLOY_API_TOKEN")));
  assert(errors.some((error) => error.includes("must use Wrangler")));
  assert(errors.some((error) => error.includes("must not use AWS-style credentials")));
});

test("requires Wrangler uploads to use repository-absolute file paths", () => {
  const relativeUploads = [
    'npm exec -- wrangler r2 object put bucket/object --file="$file"',
    "npm exec -- wrangler r2 object put bucket/object --file=./release-flat/latest.json",
    "npm exec -- wrangler r2 object put bucket/object --file ./release-flat/latest.json",
    "npm exec -- wrangler r2 object put bucket/object -f=./release-flat/latest.json",
    "npm exec -- wrangler r2 object put bucket/object -f ./release-flat/latest.json",
    `npm exec -- wrangler r2 object put bucket/object \\
          --file=./release-flat/latest.json`,
  ];
  for (const upload of relativeUploads) {
    const releaseWorkflow = validWorkflow
      .replace("name: Quality", "name: Release companion")
      .replace(
        "      - run: npm run check",
        `      - run: ${upload}
        env:
          CLOUDFLARE_API_TOKEN: \${{ secrets.CLOUDFLARE_DEPLOY_API_TOKEN }}`,
      );
    const root = createWorkflowRepository(releaseWorkflow, "release-companion.yml");

    assert(
      validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
        error.includes("upload files must use repository-absolute paths"),
      ),
    );
  }
});

test("requires companion DMG packaging to explicitly enable CI mode", () => {
  const releaseWorkflow = validWorkflow
    .replace("name: Quality", "name: Release companion")
    .replace("      - run: npm run check", "      - run: npm run tauri:build");
  const root = createWorkflowRepository(releaseWorkflow, "release-companion.yml");

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("DMG packaging must explicitly set CI=true"),
    ),
  );
});

test("requires companion releases to strictly verify the macOS app signature", () => {
  const releaseWorkflow = validWorkflow
    .replace("name: Quality", "name: Release companion")
    .replace("      - run: npm run check", "      - run: npm run tauri:build");
  const root = createWorkflowRepository(releaseWorkflow, "release-companion.yml");

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("must strictly verify the macOS app signature"),
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

test("requires ESLint to ignore Tauri build output", () => {
  const root = createWorkflowRepository(validWorkflow);
  fs.writeFileSync(path.join(root, "eslint.config.ts"), "export default [];");

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("Tauri build output must be ignored"),
    ),
  );
});

test("requires serde_json for the generated Tauri context", () => {
  const root = createWorkflowRepository(validWorkflow);
  const tauriDirectory = path.join(root, "apps/companion/src-tauri");
  fs.mkdirSync(path.join(tauriDirectory, "src"), { recursive: true });
  fs.writeFileSync(
    path.join(tauriDirectory, "Cargo.toml"),
    '[dependencies]\ntauri = { version = "2" }\n',
  );
  fs.writeFileSync(
    path.join(tauriDirectory, "src/lib.rs"),
    "pub fn run() { tauri::generate_context!(); }\n",
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("serde_json must be a direct dependency"),
    ),
  );
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

test("requires all Tauri HTTP fetch lifecycle permissions", () => {
  const root = createWorkflowRepository(validWorkflow);
  const capabilityDirectory = path.join(root, "apps/companion/src-tauri/capabilities");
  fs.mkdirSync(capabilityDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(capabilityDirectory, "default.json"),
    JSON.stringify({ permissions: ["http:allow-fetch"] }),
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("scoped HTTP fetch requires all fetch lifecycle permissions"),
    ),
  );
});

test("requires Tauri menu-bar window permissions", () => {
  const root = createWorkflowRepository(validWorkflow);
  const capabilityDirectory = path.join(root, "apps/companion/src-tauri/capabilities");
  fs.mkdirSync(capabilityDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(capabilityDirectory, "default.json"),
    JSON.stringify({ permissions: ["core:window:allow-hide"] }),
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("menu-bar window controls require explicit hide, show, and focus permissions"),
    ),
  );
});

test("requires the app target for Tauri updater artifacts", () => {
  const root = createWorkflowRepository(validWorkflow);
  const tauriDirectory = path.join(root, "apps/companion/src-tauri");
  fs.mkdirSync(tauriDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(tauriDirectory, "tauri.conf.json"),
    JSON.stringify({ bundle: { createUpdaterArtifacts: true, targets: ["dmg"] } }),
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("macOS updater artifacts require the app bundle target"),
    ),
  );
});

test("rejects missing Tauri bundle icons", () => {
  const root = createWorkflowRepository(validWorkflow);
  const tauriDirectory = path.join(root, "apps/companion/src-tauri");
  fs.mkdirSync(path.join(tauriDirectory, "capabilities"), { recursive: true });
  fs.writeFileSync(
    path.join(tauriDirectory, "capabilities/default.json"),
    JSON.stringify({ permissions: [] }),
  );
  fs.writeFileSync(
    path.join(tauriDirectory, "tauri.conf.json"),
    JSON.stringify({ bundle: { icon: ["icons/icon.png"], resources: {} } }),
  );

  assert(
    validateWorkflows(root, { requireAgentSystem: false }).errors.some((error) =>
      error.includes("bundle icon does not exist: icons/icon.png"),
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
    JSON.stringify({
      bundle: { icon: ["icons/icon.png"], resources: { "../missing.lua": "missing.lua" } },
    }),
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
