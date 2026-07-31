import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

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
];

const ARTIFACT_TYPES = [
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
      { field: "contexts", prefix: "CTX", section: "Affected Contexts" },
      { field: "decisions", prefix: "DEC", section: "Decisions" },
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
      { field: "decisions", prefix: "DEC", section: "Decisions" },
    ],
    resolvedStatus: "active",
  },
  {
    name: "decision record",
    directory: "docs/decisions",
    prefix: "DEC",
    statuses: ["proposed", "accepted", "rejected", "superseded"],
    metadataArrays: ["supersedes"],
    requiredHeadings: [
      "Context",
      "Decision",
      "Consequences",
      "Alternatives",
      "Supersedes",
      "Open Questions",
    ],
    references: [
      { field: "supersedes", prefix: "DEC", section: "Supersedes" },
    ],
    resolvedStatus: "accepted",
    categories: ["product", "domain", "technical"],
  },
];

const PLACEHOLDER_PATTERN = /\b(?:TBD|TODO)\b|\{\{[^}]+\}\}|\[fill[^\]]*\]|replace with/iu;

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function walkFiles(root, directory = root) {
  if (!fs.existsSync(directory)) return [];
  const results = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if ([".git", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) results.push(...walkFiles(root, absolute));
    if (entry.isFile()) results.push(toPosix(path.relative(root, absolute)));
  }
  return results;
}

function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/u);
  if (!match) throw new Error("missing or malformed YAML frontmatter");
  const metadata = parseYaml(match[1]);
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    throw new Error("frontmatter must be a YAML mapping");
  }
  return { metadata, body: match[2] };
}

function sectionBody(body, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
  const match = body.match(new RegExp(`^## ${escaped}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "mu"));
  return match ? match[1].trim() : null;
}

function validateDiscoveryNotes(root, errors) {
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
      if (section === null || section.length === 0) {
        errors.push(`${relative}: missing or empty section "${heading}"`);
      }
    }
  }
}

function validateLocalLinks(root, markdownFiles, errors) {
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
  for (const relative of markdownFiles) {
    const absolute = path.join(root, relative);
    const content = fs.readFileSync(absolute, "utf8");
    for (const match of content.matchAll(linkPattern)) {
      let target = match[1].trim();
      if (target.startsWith("<") && target.endsWith(">")) target = target.slice(1, -1);
      target = target.split(/\s+["']/u, 1)[0];
      if (/^(?:https?:|mailto:|tel:)/iu.test(target) || target.startsWith("#")) continue;
      const withoutFragment = target.split("#", 1)[0].split("?", 1)[0];
      if (!withoutFragment) continue;
      let decoded;
      try {
        decoded = decodeURIComponent(withoutFragment);
      } catch {
        errors.push(`${relative}: link has invalid URL encoding: ${target}`);
        continue;
      }
      const resolved = decoded.startsWith("/")
        ? path.join(root, decoded.slice(1))
        : path.resolve(path.dirname(absolute), decoded);
      if (!resolved.startsWith(path.resolve(root) + path.sep) && resolved !== path.resolve(root)) {
        errors.push(`${relative}: local link escapes the repository: ${target}`);
      } else if (!fs.existsSync(resolved)) {
        errors.push(`${relative}: broken local link: ${target}`);
      }
    }
  }
}

export function validateRepository(root, options = {}) {
  const errors = [];
  const requireFoundations = options.requireFoundations !== false;
  const allFiles = walkFiles(root);
  const markdownFiles = allFiles.filter((file) => file.endsWith(".md"));

  if (requireFoundations) {
    for (const required of REQUIRED_FOUNDATIONS) {
      if (!fs.existsSync(path.join(root, required))) errors.push(`${required}: required file is missing`);
    }
  }

  const artifacts = [];
  const ids = new Map();
  const pendingReferences = [];

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
      if (!filenameMatch) {
        errors.push(`${relative}: filename must match ${type.prefix}-###-short-name.md`);
      }

      let parsed;
      try {
        parsed = parseFrontmatter(fs.readFileSync(path.join(root, relative), "utf8"));
      } catch (error) {
        errors.push(`${relative}: ${error.message}`);
        continue;
      }

      const { metadata, body } = parsed;
      for (const field of ["id", "title", "status"]) {
        if (typeof metadata[field] !== "string" || metadata[field].trim().length === 0) {
          errors.push(`${relative}: metadata field "${field}" must be a non-empty string`);
        }
      }
      if (typeof metadata.id === "string") {
        if (!new RegExp(`^${type.prefix}-\\d{3}$`, "u").test(metadata.id)) {
          errors.push(`${relative}: id must match ${type.prefix}-###`);
        }
        if (filenameMatch && filenameMatch[1] !== metadata.id) {
          errors.push(`${relative}: filename ID ${filenameMatch[1]} does not match metadata ID ${metadata.id}`);
        }
        if (ids.has(metadata.id)) {
          errors.push(`${relative}: duplicate ID ${metadata.id}; first used by ${ids.get(metadata.id)}`);
        } else {
          ids.set(metadata.id, relative);
        }
      }
      if (!type.statuses.includes(metadata.status)) {
        errors.push(`${relative}: invalid status "${metadata.status}" for ${type.name}`);
      }
      if (type.categories && !type.categories.includes(metadata.category)) {
        errors.push(`${relative}: category must be one of ${type.categories.join(", ")}`);
      }
      if (typeof metadata.title === "string" && !body.match(new RegExp(`^# ${metadata.title.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&")}\\s*$`, "mu"))) {
        errors.push(`${relative}: H1 must exactly match metadata title`);
      }
      if (PLACEHOLDER_PATTERN.test(body)) {
        errors.push(`${relative}: governed artifacts may not contain placeholders`);
      }

      for (const field of type.metadataArrays) {
        if (!Array.isArray(metadata[field]) || metadata[field].some((value) => typeof value !== "string")) {
          errors.push(`${relative}: metadata field "${field}" must be an array of IDs`);
        }
      }
      for (const heading of type.requiredHeadings) {
        const section = sectionBody(body, heading);
        if (section === null || section.length === 0) {
          errors.push(`${relative}: missing or empty section "${heading}"`);
        }
      }

      for (const reference of type.references) {
        const values = Array.isArray(metadata[reference.field]) ? metadata[reference.field] : [];
        const section = sectionBody(body, reference.section) ?? "";
        if (values.length === 0 && section !== "None.") {
          errors.push(`${relative}: section "${reference.section}" must say "None." when metadata is empty`);
        }
        for (const id of values) {
          if (!new RegExp(`^${reference.prefix}-\\d{3}$`, "u").test(id)) {
            errors.push(`${relative}: ${reference.field} contains invalid ${reference.prefix} ID ${id}`);
          }
          if (!section.includes(id)) {
            errors.push(`${relative}: section "${reference.section}" must mention ${id}`);
          }
          pendingReferences.push({ from: relative, id });
        }
      }

      if (metadata.status === type.resolvedStatus) {
        const openQuestions = sectionBody(body, "Open Questions");
        if (openQuestions !== "None.") {
          errors.push(`${relative}: ${type.resolvedStatus} artifacts must have "None." in Open Questions`);
        }
      }
      if (!index.includes(`(${filename})`)) {
        errors.push(`${relative}: artifact is missing from ${type.directory}/README.md`);
      }
      artifacts.push({ relative, metadata });
    }
  }

  for (const reference of pendingReferences) {
    if (!ids.has(reference.id)) errors.push(`${reference.from}: dangling artifact reference ${reference.id}`);
  }

  validateDiscoveryNotes(root, errors);
  validateLocalLinks(root, markdownFiles, errors);
  return { errors: [...new Set(errors)].sort(), artifactCount: artifacts.length };
}
