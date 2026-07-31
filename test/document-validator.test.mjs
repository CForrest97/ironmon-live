import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { validateRepository } from "../scripts/document-validator.mjs";

const sections = {
  PRD: [
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
  ],
};

function createRepository() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "ironmon-docs-"));
  fs.mkdirSync(path.join(root, "docs/product/specs"), { recursive: true });
  fs.writeFileSync(path.join(root, "README.md"), "# Fixture\n");
  fs.writeFileSync(path.join(root, "docs/product/specs/README.md"), "# Specs\n\n- [PRD-001](PRD-001-example.md)\n");
  return root;
}

function productDocument(overrides = {}) {
  const values = {
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
  const body = sections.PRD.flatMap((heading) => [
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

function errorsFor(root) {
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
