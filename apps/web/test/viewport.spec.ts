import { expect, test } from "@playwright/test";
import { activeRunEvent, emptyPartyEvent, installChannelSocket } from "../visual/scenes.ts";

test("the expanded channel remains operable at 640 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addInitScript(installChannelSocket, activeRunEvent);
  await page.goto("/channel/00042");
  await expect(page.getByRole("region", { name: "Run overview" })).toBeVisible();
  await expect(page.getByText("trainer battle · single").first()).toBeVisible();
  await expect(page.getByRole("group", { name: "Route context" })).toContainText("Route 1");
  await expect(page.getByRole("group", { name: "Route context" })).toContainText("0/0 trainers");
  await expect(page.locator(".progress-step")).toHaveCount(0);
  await expect(page.locator(".progress-track")).toHaveCount(0);
  await expect(
    page.evaluate(() => {
      const sprite = document.querySelector(".overview-party-row .sprite");
      const name = document.querySelector(".overview-party-name");
      const types = document.querySelector(".overview-party-identity .type-tags");
      const ability = document.querySelector(".overview-party-ability");
      const moves = document.querySelector(".overview-party-moves");
      const baseStats = document.querySelector(".overview-party-info .base-stat-strip");
      if (!sprite || !name || !types || !ability || !moves || !baseStats) return false;

      const spriteBox = sprite.getBoundingClientRect();
      const nameBox = name.getBoundingClientRect();
      const typeBox = types.getBoundingClientRect();
      const abilityBox = ability.getBoundingClientRect();
      const movesBox = moves.getBoundingClientRect();
      const baseStatsBox = baseStats.getBoundingClientRect();
      return (
        Math.abs(nameBox.top - typeBox.top) <= 4 &&
        Math.abs(abilityBox.top - movesBox.top) <= 4 &&
        baseStatsBox.left >= spriteBox.right &&
        baseStatsBox.top < spriteBox.bottom
      );
    }),
  ).resolves.toBe(true);
  for (const panel of ["Party details", "Battle details", "Route trainers", "Run progress"]) {
    await expect(page.getByRole("button", { name: new RegExp(panel, "u") })).toBeVisible();
  }
  await page.getByRole("button", { name: /Party details/u }).click();
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
