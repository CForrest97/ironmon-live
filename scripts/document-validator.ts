import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

type Metadata = Record<string, unknown>;

interface ReferenceRule {
  field: string;
  idPattern: RegExp;
  label: string;
  section: string;
  requireNoneWhenEmpty?: boolean;
}

interface ArtifactType {
  name: string;
  directory: string;
  prefix: string;
  statuses: string[];
  metadataArrays: string[];
  requiredHeadings: string[];
  references: ReferenceRule[];
  resolvedStatus?: string;
  categories?: string[];
  kinds?: string[];
}

interface ParsedDocument {
  metadata: Metadata;
  body: string;
}

interface PendingReference {
  from: string;
  id: string;
}

interface ValidationOptions {
  requireFoundations?: boolean;
}

export interface ValidationResult {
  errors: string[];
  artifactCount: number;
}

const REQUIRED_FOUNDATIONS = [
  "AGENTS.md",
  "README.md",
  "CONTRIBUTING.md",
  "SECURITY.md",
  "LICENSE",
  "docs/product/product-brief.md",
  "docs/product/principles.md",
  "docs/domain/narrative.md",
  "docs/domain/glossary.md",
  "docs/domain/context-map.md",
  "docs/repository/evolution.md",
  "work/README.md",
  "work/items/README.md",
];

const ARTIFACT_TYPES: ArtifactType[] = [
  {
    name: "product specification",
    directory: "docs/product/specs",
    prefix: "PRD",
    statuses: ["draft", "accepted", "superseded"],
    metadataArrays: ["contexts", "decisions"],
    requiredHeadings: [
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
    references: [
      { field: "contexts", idPattern: /^CTX-\d{3}$/u, label: "CTX", section: "Affected Contexts", requireNoneWhenEmpty: true },
      { field: "decisions", idPattern: /^DEC-\d{3}$/u, label: "DEC", section: "Decisions", requireNoneWhenEmpty: true },
    ],
    resolvedStatus: "accepted",
  },
  {
    name: "bounded context",
    directory: "docs/domain/contexts",
    prefix: "CTX",
    statuses: ["draft", "active", "retired"],
    metadataArrays: ["decisions"],
    requiredHeadings: [
      "Purpose",
      "Language",
      "Responsibilities",
      "Invariants",
      "Boundaries",
      "Integrations",
      "Context Relationships",
      "Decisions",
      "Open Questions",
    ],
    references: [
      { field: "decisions", idPattern: /^DEC-\d{3}$/u, label: "DEC", section: "Decisions", requireNoneWhenEmpty: true },
    ],
    resolvedStatus: "active",
  },
  {
    name: "decision record",
    directory: "docs/decisions",
    prefix: "DEC",
    statuses: ["proposed", "accepted", "rejected", "superseded"],
    metadataArrays: ["supersedes"],
    requiredHeadings: ["Context", "Decision", "Consequences", "Alternatives", "Supersedes", "Open Questions"],
    references: [
      { field: "supersedes", idPattern: /^DEC-\d{3}$/u, label: "DEC", section: "Supersedes", requireNoneWhenEmpty: true },
    ],
    resolvedStatus: "accepted",
    categories: ["product", "domain"],
  },
  {
    name: "work item",
    directory: "work/items",
    prefix: "WORK",
    statuses: ["backlog", "ready", "in-progress", "blocked", "done", "cancelled"],
    metadataArrays: ["artifacts"],
    requiredHeadings: ["Intent", "Outcome", "Context", "Scope", "Acceptance Criteria", "Plan", "Validation", "Agent Notes"],
    references: [
      { field: "artifacts", idPattern: /^(?:PRD|CTX|DEC)-\d{3}$/u, label: "PRD, CTX, or DEC", section: "Context" },
    ],
    kinds: ["product", "domain", "technical", "repository"],
  },
];

const PLACEHOLDER_PATTERN = /\b(?:TBD|TODO)\b|\{\{[^}]+\}\}|\[fill[^\]]*\]|replace with/iu;

function toPosix(value: string): string {
  return value.split(path.sep).join("/");
}

function walkFiles(root: string, directory = root): string[] {
  if (!fs.existsSync(directory)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(root, absolute));
    if (entry.isFile()) results.push(toPosix(path.relative(root, absolute)));
  }
  return results;
}

function parseFrontmatter(content: string): ParsedDocument {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u);
  if (!match) throw new Error("missing or malformed YAML frontmatter");
  const metadata: unknown = parseYaml(match[1] ?? "");
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("frontmatter must be a YAML mapping");
  }
  return { metadata: metadata as Metadata, body: match[2] ?? "" };
}

function sectionBody(body: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = body.match(new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "mu"));
  return match?.[1]?.trim() ?? null;
}

function validateDiscoveryNotes(root: string, errors: string[]): void {
  const directory = path.join(root, "docs/product/discovery");
  if (!fs.existsSync(directory)) return;
  const required = ["Date and source", "Question", "Observations", "Interpretation", "Follow-up"];
  for (const name of fs.readdirSync(directory)) {
    if (!name.endsWith(".md") || ["README.md", "_template.md"].includes(name)) continue;
    const relative = `docs/product/discovery/${name}`;
    if (!/^\d{4}-\d{2}-\d{2}-[a-z0-9]+(?:-[a-z0-9]+)*\.md$/u.test(name)) {
      errors.push(`${relative}: discovery filename must be YYYY-MM-DD-short-name.md`);
    }
    const body = fs.readFileSync(path.join(directory, name), "utf8");
    for (const heading of required) {
      const section = sectionBody(body, heading);
      if (section === null || section.length === 0) errors.push(`${relative}: missing or empty section "${heading}"`);
    }
  }
}

function validateLocalLinks(root: string, markdownFiles: string[], errors: string[]): void {
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
  for (const relative of markdownFiles) {
    const absolute = path.join(root, relative);
    const content = fs.readFileSync(absolute, "utf8");
    for (const match of content.matchAll(linkPattern)) {
      let target = match[1]?.trim() ?? "";
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      target = target.split(/\s+["']/u, 1)[0] ?? "";
      if (/^(?:https?:|mailto:|tel:)/iu.test(target) || target.startsWith("#")) continue;
      const withoutFragment = target.split("#", 1)[0]?.split("?", 1)[0] ?? "";
      if (!withoutFragment) continue;
      let decoded: string;
      try {
        decoded = decodeURIComponent(withoutFragment);
      } catch {
        errors.push(`${relative}: link has invalid URL encoding: ${target}`);
        continue;
      }
      const resolved = decoded.startsWith("/")
        ? path.join(root, decoded.slice(1))
        : path.resolve(path.dirname(absolute), decoded);
      const resolvedRoot = path.resolve(root);
      if (!resolved.startsWith(`${resolvedRoot}${path.sep}`) && resolved !== resolvedRoot) {
        errors.push(`${relative}: local link escapes the repository: ${target}`);
      } else if (!fs.existsSync(resolved)) {
        errors.push(`${relative}: broken local link: ${target}`);
      }
    }
  }
}

export function validateRepository(root: string, options: ValidationOptions = {}): ValidationResult {
  const errors: string[] = [];
  const requireFoundations = options.requireFoundations !== false;
  const allFiles = walkFiles(root);
  const markdownFiles = allFiles.filter((file) => file.endsWith(".md"));

  if (requireFoundations) {
    for (const required of REQUIRED_FOUNDATIONS) {
      if (!fs.existsSync(path.join(root, required))) errors.push(`${required}: required file is missing`);
    }
  }

  const ids = new Map<string, string>();
  const pendingReferences: PendingReference[] = [];
  let artifactCount = 0;

  for (const type of ARTIFACT_TYPES) {
    const absoluteDirectory = path.join(root, type.directory);
    if (!fs.existsSync(absoluteDirectory)) continue;
    const indexPath = path.join(absoluteDirectory, "README.md");
    const index = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, "utf8") : "";
    if (!fs.existsSync(indexPath)) errors.push(`${type.directory}/README.md: artifact index is missing`);

    for (const filename of fs.readdirSync(absoluteDirectory).sort()) {
      if (!filename.endsWith(".md") || ["README.md", "_template.md"].includes(filename)) continue;
      const relative = `${type.directory}/${filename}`;
      const filenameMatch = filename.match(new RegExp(`^(${type.prefix}-\\d{3})-[a-z0-9]+(?:-[a-z0-9]+)*\\.md$`, "u"));
      if (!filenameMatch) errors.push(`${relative}: filename must match ${type.prefix}-###-short-name.md`);

      let parsed: ParsedDocument;
      try {
        parsed = parseFrontmatter(fs.readFileSync(path.join(root, relative), "utf8"));
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        errors.push(`${relative}: ${message}`);
        continue;
      }

      const { metadata, body } = parsed;
      for (const field of ["id", "title", "status"]) {
        const value = metadata[field];
        if (typeof value !== "string" || value.trim().length === 0) {
          errors.push(`${relative}: metadata field "${field}" must be a non-empty string`);
        }
      }

      const id = metadata.id;
      if (typeof id === "string") {
        if (!new RegExp(`^${type.prefix}-\\d{3}$`, "u").test(id)) errors.push(`${relative}: id must match ${type.prefix}-###`);
        if (filenameMatch?.[1] && filenameMatch[1] !== id) {
          errors.push(`${relative}: filename ID ${filenameMatch[1]} does not match metadata ID ${id}`);
        }
        const existing = ids.get(id);
        if (existing) errors.push(`${relative}: duplicate ID ${id}; first used by ${existing}`);
        else ids.set(id, relative);
      }

      if (typeof metadata.status !== "string" || !type.statuses.includes(metadata.status)) {
        errors.push(`${relative}: invalid status "${String(metadata.status)}" for ${type.name}`);
      }
      if (type.categories && (typeof metadata.category !== "string" || !type.categories.includes(metadata.category))) {
        errors.push(`${relative}: category must be one of ${type.categories.join(", ")}`);
      }
      if (type.kinds && (typeof metadata.kind !== "string" || !type.kinds.includes(metadata.kind))) {
        errors.push(`${relative}: kind must be one of ${type.kinds.join(", ")}`);
      }
      if (typeof metadata.title === "string") {
        const escapedTitle = metadata.title.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
        if (!body.match(new RegExp(`^# ${escapedTitle}\\s*$`, "mu"))) errors.push(`${relative}: H1 must exactly match metadata title`);
      }
      if (PLACEHOLDER_PATTERN.test(body)) errors.push(`${relative}: governed artifacts may not contain placeholders`);

      for (const field of type.metadataArrays) {
        const value = metadata[field];
        if (!Array.isArray(value) || value.some((entry: unknown) => typeof entry !== "string")) {
          errors.push(`${relative}: metadata field "${field}" must be an array of IDs`);
        }
      }
      for (const heading of type.requiredHeadings) {
        const section = sectionBody(body, heading);
        if (section === null || section.length === 0) errors.push(`${relative}: missing or empty section "${heading}"`);
      }

      for (const reference of type.references) {
        const rawValues = metadata[reference.field];
        const values = Array.isArray(rawValues) ? rawValues.filter((value): value is string => typeof value === "string") : [];
        const section = sectionBody(body, reference.section) ?? "";
        if (reference.requireNoneWhenEmpty && values.length === 0 && section !== "None.") {
          errors.push(`${relative}: section "${reference.section}" must say "None." when metadata is empty`);
        }
        for (const referencedId of values) {
          if (!reference.idPattern.test(referencedId)) {
            errors.push(`${relative}: ${reference.field} contains invalid ${reference.label} ID ${referencedId}`);
          }
          if (!section.includes(referencedId)) errors.push(`${relative}: section "${reference.section}" must mention ${referencedId}`);
          pendingReferences.push({ from: relative, id: referencedId });
        }
      }

      if (type.resolvedStatus && metadata.status === type.resolvedStatus && sectionBody(body, "Open Questions") !== "None.") {
        errors.push(`${relative}: ${type.resolvedStatus} artifacts must have "None." in Open Questions`);
      }
      if (!index.includes(`(${filename})`)) errors.push(`${relative}: artifact is missing from ${type.directory}/README.md`);
      if (type.prefix === "WORK" && typeof metadata.status === "string") {
        const targetSection = ["done", "cancelled"].includes(metadata.status) ? "Completed" : "Active";
        if (!(sectionBody(index, targetSection) ?? "").includes(`(${filename})`)) {
          errors.push(`${relative}: ${metadata.status} work item must be listed under "${targetSection}"`);
        }
      }
      artifactCount += 1;
    }
  }

  for (const reference of pendingReferences) {
    if (!ids.has(reference.id)) errors.push(`${reference.from}: dangling artifact reference ${reference.id}`);
  }

  validateDiscoveryNotes(root, errors);
  validateLocalLinks(root, markdownFiles, errors);
  return { errors: [...new Set(errors)].sort(), artifactCount };
}
