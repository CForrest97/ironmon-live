import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRepository } from "../scripts/document-validator.ts";

interface ProductValues {
  id: string;
  title: string;
  status: string;
  contexts: string[];
  decisions: string[];
  openQuestions: string;
}

const productSections = [
  "Problem",
  "Evidence",
  "Users",
  "Desired Outcomes",
  "Non-goals",
  "Scope",
  "Requirements",
  "Acceptance Criteria",
  "Affected Contexts",
  "Decisions",
  "Risks",
  "Open Questions",
];

function createRepository(): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ironmon-docs-"));
  fs.mkdirSync(path.join(root, "docs/product/specs"), { recursive: true });
  fs.writeFileSync(path.join(root, "README.md"), "# Fixture\n");
  fs.writeFileSync(path.join(root, "docs/product/specs/README.md"), "# Specs\n\n- [PRD-001](PRD-001-example.md)\n");
  return root;
}

function productDocument(overrides: Partial<ProductValues> = {}): string {
  const values: ProductValues = {
    id: "PRD-001",
    title: "Example",
    status: "draft",
    contexts: [],
    decisions: [],
    openQuestions: "- What evidence is still needed?",
    ...overrides,
  };
  const metadata = [
    "---",
    `id: ${values.id}`,
    `title: ${values.title}`,
    `status: ${values.status}`,
    `contexts: [${values.contexts.join(", ")}]`,
    `decisions: [${values.decisions.join(", ")}]`,
    "---",
    "",
    `# ${values.title}`,
    "",
  ];
  const body = productSections.flatMap((heading) => [
    `## ${heading}`,
    "",
    heading === "Open Questions"
      ? values.openQuestions
      : ["Affected Contexts", "Decisions"].includes(heading)
        ? "None."
        : `Concrete ${heading.toLowerCase()} content.`,
    "",
  ]);
  return [...metadata, ...body].join("\n");
}

function errorsFor(root: string): string[] {
  return validateRepository(root, { requireFoundations: false }).errors;
}

test("accepts a complete draft with explicit open questions", () => {
  const root = createRepository();
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), productDocument());
  assert.deepEqual(errorsFor(root), []);
});

test("rejects an invalid lifecycle status", () => {
  const root = createRepository();
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), productDocument({ status: "ready" }));
  assert(errorsFor(root).some((error) => error.includes("invalid status")));
});

test("rejects a missing required section", () => {
  const root = createRepository();
  const content = productDocument().replace(/## Risks[\s\S]*?(?=## Open Questions)/u, "");
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), content);
  assert(errorsFor(root).some((error) => error.includes('missing or empty section "Risks"')));
});

test("rejects a dangling artifact reference", () => {
  const root = createRepository();
  const content = productDocument({ contexts: ["CTX-404"] }).replace("## Affected Contexts\n\nNone.", "## Affected Contexts\n\nCTX-404");
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), content);
  assert(errorsFor(root).some((error) => error.includes("dangling artifact reference CTX-404")));
});

test("rejects a duplicate artifact ID", () => {
  const root = createRepository();
  fs.writeFileSync(path.join(root, "docs/product/specs/README.md"), "# Specs\n\n- [One](PRD-001-example.md)\n- [Two](PRD-002-other.md)\n");
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), productDocument());
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-002-other.md"), productDocument());
  assert(errorsFor(root).some((error) => error.includes("duplicate ID PRD-001")));
});

test("rejects a broken local Markdown link", () => {
  const root = createRepository();
  fs.writeFileSync(path.join(root, "README.md"), "# Fixture\n\n[Missing](missing.md)\n");
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), productDocument());
  assert(errorsFor(root).some((error) => error.includes("broken local link")));
});

test("rejects accepted artifacts with unresolved questions", () => {
  const root = createRepository();
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), productDocument({ status: "accepted" }));
  assert(errorsFor(root).some((error) => error.includes('must have "None." in Open Questions')));
});

test("rejects an artifact omitted from its index", () => {
  const root = createRepository();
  fs.writeFileSync(path.join(root, "docs/product/specs/README.md"), "# Specs\n");
  fs.writeFileSync(path.join(root, "docs/product/specs/PRD-001-example.md"), productDocument());
  assert(errorsFor(root).some((error) => error.includes("artifact is missing")));
});

test("validates Markdown work-item contracts", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ironmon-work-"));
  fs.mkdirSync(path.join(root, "work/items"), { recursive: true });
  fs.writeFileSync(path.join(root, "work/items/README.md"), "# Work\n\n## Active\n\n- [Work](WORK-001-example.md)\n\n## Completed\n\nNone.\n");
  fs.writeFileSync(path.join(root, "work/items/WORK-001-example.md"), `---
id: WORK-001
title: Example work
status: in-progress
kind: repository
artifacts: []
learnings: []
---

# Example work

## Intent

Improve the repository.

## Outcome

The result is observable.

## Context

Repository context.

## Scope

One focused change.

## Acceptance Criteria

The check passes.

## Plan

Make and verify the change.

## Validation

Run the quality command.

## Agent Notes

No reusable correction observed.
`);
  assert.deepEqual(errorsFor(root), []);
});

test("rejects learning records without their prevention contract", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ironmon-learning-"));
  fs.mkdirSync(path.join(root, "docs/repository/learnings"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/repository/learnings/README.md"), "# Learnings\n\n## Active\n\n- [Learning](LRN-001-example.md)\n\n## Superseded\n\nNone.\n");
  fs.writeFileSync(path.join(root, "docs/repository/learnings/LRN-001-example.md"), `---
id: LRN-001
title: Example learning
status: active
trigger: correction
work_items: []
---

# Example learning

## Observation

A reusable mistake happened.

## Root Cause

The guard was missing.

## Correction

The current instance was fixed.

## Evidence

The failed check demonstrates it.

## Follow-up

None.
`);
  assert(errorsFor(root).some((error) => error.includes('missing or empty section "Prevention"')));
});
