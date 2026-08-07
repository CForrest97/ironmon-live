import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const styles = fs.readFileSync(new URL("../apps/web/src/styles.css", import.meta.url), "utf8");

test("startup ball prompt uses stepped effects and honours reduced motion", () => {
  assert.match(styles, /starter-ball-bounce/u);
  assert.match(styles, /steps\(4, end\)/u);
  assert.match(styles, /starter-sparkle:nth-child\(4\)/u);
  assert.match(styles, /@media\s+\(prefers-reduced-motion:\s+reduce\)/u);
  assert.match(styles, /\.starter-sparkles\s+\{\s+display: none;/u);
});
