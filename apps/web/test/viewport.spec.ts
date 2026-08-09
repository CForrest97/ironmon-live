import { expect, test } from "@playwright/test";
import { activeRunEvent, emptyPartyEvent, installChannelSocket } from "../visual/scenes.ts";

test("the expanded channel remains operable at 640 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addInitScript(installChannelSocket, activeRunEvent);
  await page.goto("/channel/00042");
  await expect(page.getByRole("region", { name: "Run overview" })).toBeVisible();
  await expect(page.getByText("Route 1").first()).toBeVisible();
  await expect(page.locator(".progress-step")).toHaveCount(0);
  await expect(page.locator(".progress-track")).toHaveCount(0);
  for (const panel of ["Party", "Battle", "Route", "Progress"]) {
    await expect(page.getByRole("button", { name: panel })).toBeVisible();
  }
  await page.getByRole("button", { name: "Party" }).click();
  await expect(page.getByText("Tackle").first()).toBeVisible();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});

test("the empty-party active-run scene remains three columns at 640 CSS pixels", async ({
  page,
}) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addInitScript(installChannelSocket, emptyPartyEvent);
  await page.goto("/channel/00042");
  await expect(page.getByRole("heading", { name: "A first pick, just for fun" })).toBeVisible();
  await expect(
    page.getByRole("list", { name: "Starter ball choices" }).getByRole("listitem"),
  ).toHaveCount(3);
  await expect(
    page.evaluate(() => {
      const options = document.querySelector<HTMLElement>(".starter-ball-options");
      return options
        ? getComputedStyle(options).gridTemplateColumns.split(" ").length === 3
        : false;
    }),
  ).resolves.toBe(true);
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});
