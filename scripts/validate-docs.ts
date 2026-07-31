#!/usr/bin/env node

import process from "node:process";
import { validateRepository } from "./document-validator.ts";

const result = validateRepository(process.cwd());
if (result.errors.length > 0) {
  console.error(`Documentation validation failed with ${result.errors.length} error(s):`);
  for (const error of result.errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Documentation validation passed (${result.artifactCount} governed artifact(s)).`);
}
