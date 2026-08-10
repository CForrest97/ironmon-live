/**
 * Captures the scenes in `scenes.ts` as review-ready screenshots plus a
 * geometry manifest.
 *
 * The manifest matters as much as the images. Judging alignment or whitespace
 * from pixels alone invites confident guesses, so every capture also records
 * the measured position and size of each landmark. The reviewer measures from
 * the manifest and reserves the image for what only an image can answer.
 */

import { spawn, type ChildProcess } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { chromium, type Browser, type Page } from "@playwright/test";
import { readValue, readValues } from "./args.ts";
import type { CaptureImage, CaptureRecord, Manifest, Viewport } from "./manifest.ts";
import { freezeRandomness, installChannelSocket, scenes, type Scene } from "./scenes.ts";

/**
 * Claude resamples anything longer than this on its longest edge, so rendering
 * to fit costs fewer tokens than sending pixels that are thrown away. A capture
 * wider than the limit is rendered at a fractional device scale factor, which
 * keeps the CSS layout honest while shrinking the image.
 */
const MAX_IMAGE_EDGE = 1568;

/** Bands beyond the third are rarely worth their tokens; below-fold review is about the first scroll. */
const MAX_BANDS = 3;

const VIEWPORTS: readonly Viewport[] = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "narrow", width: 640, height: 900 },
];

/** Reviewed by default; `--viewport=narrow` or `--viewport=all` opts into the rest. */
const DEFAULT_VIEWPORT_NAMES = ["desktop"];

/** Captures run this many scene/viewport pairs at once, across separate browser contexts. */
const CONCURRENCY = 4;

const LANDMARK_SELECTOR = [
  "main",
  "header",
  "nav",
  "footer",
  "section",
  "article",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "p.eyebrow",
  "button",
  "input",
  "a.channel-card",
  ".panel",
  ".channel-cards > li",
  ".party-grid > *",
  ".starter-ball-choice",
].join(", ");

const MAX_LANDMARKS = 120;

/** Sprites are fetched from real third-party CDNs; give them this long to settle before capturing regardless. */
const IMAGE_LOAD_TIMEOUT_MS = 8_000;

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const passedArguments = process.argv.slice(2);

const baseUrl = readValue(passedArguments, "--base-url") ?? "http://127.0.0.1:4173";
const outputDirectory = path.resolve(
  repositoryRoot,
  readValue(passedArguments, "--out") ?? "apps/web/test-results/visual",
);

const selectedScenes = () => {
  const requested = readValues(passedArguments, "--scene");
  if (requested.length === 0) return scenes;
  const matched = scenes.filter((scene) => requested.includes(scene.name));
  if (matched.length !== requested.length) {
    const known = scenes.map((scene) => scene.name).join(", ");
    throw new Error(`unknown scene requested; known scenes are ${known}`);
  }
  return matched;
};

const selectedViewports = () => {
  const requested = readValues(passedArguments, "--viewport");
  if (requested.length === 0) {
    return VIEWPORTS.filter((viewport) => DEFAULT_VIEWPORT_NAMES.includes(viewport.name));
  }
  if (requested.includes("all")) return VIEWPORTS;
  const matched = VIEWPORTS.filter((viewport) => requested.includes(viewport.name));
  if (matched.length === 0) {
    const known = [...VIEWPORTS.map((viewport) => viewport.name), "all"].join(", ");
    throw new Error(`unknown viewport requested; known viewports are ${known}`);
  }
  return matched;
};

const serverIsUp = async () => {
  try {
    const response = await fetch(baseUrl, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
};

const waitForServer = async (timeoutMs: number) => {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await serverIsUp()) return true;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  return false;
};

const startServer = async (): Promise<ChildProcess | undefined> => {
  if (await serverIsUp()) {
    console.error(`reusing the server already answering on ${baseUrl}`);
    return undefined;
  }
  const port = new URL(baseUrl).port || "4173";
  console.error(`starting the preview server on ${baseUrl}`);
  const server = spawn(
    "npm",
    [
      "run",
      "dev",
      "--workspace",
      "@ironmon-live/web",
      "--",
      "--mode",
      "e2e",
      "--host",
      "127.0.0.1",
      "--port",
      port,
    ],
    { cwd: repositoryRoot, stdio: ["ignore", "ignore", "pipe"] },
  );
  // Buffered rather than inherited so the SIGTERM npm reports at shutdown does
  // not read as a capture failure. It is only worth showing if startup fails.
  let serverErrors = "";
  server.stderr.on("data", (chunk: Buffer) => {
    serverErrors += chunk.toString();
  });
  if (!(await waitForServer(60_000))) {
    server.kill();
    throw new Error(
      `the preview server did not answer on ${baseUrl} within 60s\n${serverErrors}`.trimEnd(),
    );
  }
  return server;
};

const readMetrics = (page: Page, viewportHeight: number, selector: string, limit: number) =>
  page.evaluate(
    ({ landmarkSelector, foldHeight, maxLandmarks }) => {
      const labelFor = (element: Element) => {
        const ariaLabel = element.getAttribute("aria-label");
        if (ariaLabel) return ariaLabel;
        const labelledBy = element.getAttribute("aria-labelledby");
        const labelSource = labelledBy ? document.getElementById(labelledBy) : null;
        const text = (labelSource ?? element).textContent.replace(/\s+/g, " ").trim();
        return text.length > 60 ? `${text.slice(0, 57)}...` : text;
      };

      const allLandmarks = [...document.querySelectorAll(landmarkSelector)]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = window.getComputedStyle(element);
          return {
            tag: element.tagName.toLowerCase(),
            label: labelFor(element),
            className: element.className.split(/\s+/).slice(0, 2).join(" "),
            x: Math.round(rect.x + window.scrollX),
            y: Math.round(rect.y + window.scrollY),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
            fontSize: Math.round(Number.parseFloat(style.fontSize)),
            fontWeight: style.fontWeight,
            fullyAboveFold: rect.y + window.scrollY + rect.height <= foldHeight,
          };
        })
        .filter((landmark) => landmark.width > 0 && landmark.height > 0)
        .sort((first, second) => first.y - second.y || first.x - second.x);

      // Merge landmark y-ranges into a union so a parent and its children
      // collapse into one span instead of double-counting — this measures
      // genuinely empty bands of the fold, not the padding inside a card.
      const covered: Array<{ start: number; end: number }> = [];
      for (const landmark of allLandmarks) {
        const start = landmark.y;
        const end = landmark.y + landmark.height;
        const last = covered[covered.length - 1];
        if (last && start <= last.end) last.end = Math.max(last.end, end);
        else covered.push({ start, end });
      }
      const coveredWithinFold = covered.reduce((total, range) => {
        const start = Math.min(range.start, foldHeight);
        const end = Math.min(range.end, foldHeight);
        return total + Math.max(0, end - start);
      }, 0);
      const lastRange = covered.at(-1);
      const lastCoveredY = lastRange ? Math.min(lastRange.end, foldHeight) : 0;

      return {
        documentHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
        foldFillRatio: Math.round((coveredWithinFold / foldHeight) * 100) / 100,
        foldEmptyBelowContentPx: Math.max(0, Math.round(foldHeight - lastCoveredY)),
        landmarks: allLandmarks.slice(0, maxLandmarks),
        renderedText: document.body.innerText.replace(/\s+/g, " ").trim(),
      };
    },
    { landmarkSelector: selector, foldHeight: viewportHeight, maxLandmarks: limit },
  );

const captureScene = async (
  browser: Browser,
  scene: Scene,
  viewport: Viewport,
): Promise<CaptureRecord> => {
  const deviceScaleFactor = Math.min(1, MAX_IMAGE_EDGE / viewport.width);
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor,
    reducedMotion: "reduce",
  });
  try {
    const page = await context.newPage();
    await page.addInitScript(freezeRandomness);
    if (scene.channelEvent !== undefined) {
      await page.addInitScript(installChannelSocket, scene.channelEvent);
    }
    if (scene.activeChannels !== undefined) {
      await page.route("**/api/channels", (route) =>
        route.fulfill({ json: scene.activeChannels as Record<string, unknown> }),
      );
    }
    if (scene.companionRelease !== undefined) {
      await page.route("**/companion/latest.json", (route) =>
        route.fulfill({ json: scene.companionRelease as Record<string, unknown> }),
      );
    }

    await page.goto(new URL(scene.path, baseUrl).toString(), { waitUntil: "domcontentloaded" });
    await page.locator(scene.ready).first().waitFor({ state: "visible", timeout: 15_000 });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
    // Sprites come from third-party CDNs (raw.githubusercontent.com,
    // play.pokemonshowdown.com) — real network requests, kept deliberately
    // unblocked so the capture matches what a viewer actually sees. Wait for
    // every <img> to settle (loaded or failed) so the screenshot never
    // catches one mid-fetch; give up after IMAGE_LOAD_TIMEOUT_MS rather than
    // hang the whole capture on a slow or unreachable CDN.
    await page
      .waitForFunction(() => [...document.images].every((image) => image.complete), undefined, {
        timeout: IMAGE_LOAD_TIMEOUT_MS,
      })
      .catch(() => {});

    const metrics = await readMetrics(page, viewport.height, LANDMARK_SELECTOR, MAX_LANDMARKS);
    const bandCount = Math.min(MAX_BANDS, Math.ceil(metrics.documentHeight / viewport.height));
    const images: CaptureImage[] = [];

    for (let index = 0; index < bandCount; index += 1) {
      const top = index * viewport.height;
      const height = Math.min(viewport.height, metrics.documentHeight - top);
      if (height <= 0) break;
      const file = `${scene.name}--${viewport.name}--band${String(index + 1)}.png`;
      await page.screenshot({
        path: path.join(outputDirectory, file),
        fullPage: true,
        clip: { x: 0, y: top, width: viewport.width, height },
        animations: "disabled",
        caret: "hide",
      });
      images.push({
        file,
        band:
          index === 0
            ? "above the fold"
            : `scroll ${String(index)} (page y ${String(top)}-${String(top + height)})`,
      });
    }

    return {
      scene: scene.name,
      title: scene.title,
      path: scene.path,
      intent: scene.intent,
      viewport,
      deviceScaleFactor,
      imageWidth: Math.round(viewport.width * deviceScaleFactor),
      images,
      ...metrics,
    };
  } finally {
    await context.close();
  }
};

const main = async () => {
  const server = await startServer();
  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
      : {},
  );
  const jobs = selectedScenes().flatMap((scene) =>
    selectedViewports().map((viewport) => ({ scene, viewport })),
  );
  const captures: CaptureRecord[] = [];
  try {
    let next = 0;
    const worker = async () => {
      for (;;) {
        const index = next;
        next += 1;
        const job = jobs[index];
        if (!job) return;
        console.error(`capturing ${job.scene.name} at ${job.viewport.name}`);
        captures[index] = await captureScene(browser, job.scene, job.viewport);
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, jobs.length) }, worker));
  } finally {
    await browser.close();
    server?.kill();
  }

  const manifest: Manifest = {
    capturedAt: new Date().toISOString(),
    baseUrl,
    note: "Coordinates and sizes are CSS pixels. Multiply by deviceScaleFactor for image pixels. Sprite artwork loads from real third-party CDNs; a sprite that failed or was still loading when captured renders as an empty box and is worth flagging like any other content-fit gap. foldFillRatio is the fraction of the fold covered by any landmark (nested elements merged so a parent and its children only count once); foldEmptyBelowContentPx is the empty gap between the last landmark and the fold. Low fill or a large trailing gap is a measurable whitespace defect, not a matter of taste.",
    captures,
  };
  await writeFile(
    path.join(outputDirectory, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.error(`captured ${String(captures.length)} views into ${outputDirectory}`);
  console.log(outputDirectory);
};

await main();
