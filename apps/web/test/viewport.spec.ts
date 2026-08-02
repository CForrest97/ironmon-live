import { expect, test } from "@playwright/test";

const available = <T>(value: T) => ({ availability: "available", value });
const unavailable = { availability: "unavailable" };
const member = {
  id: "1",
  name: "Bulbasaur",
  speciesId: available("1"),
  level: available(5),
  currentHp: available(12),
  maximumHp: available(20),
  types: available(["grass"]),
  status: available("healthy"),
  ability: unavailable,
  heldItem: unavailable,
  moves: available([{ id: "tackle", name: "Tackle", pp: available(35) }]),
  stats: available({ hp: 20 }),
  statStages: available({ atk: 0 }),
  ivs: available({ hp: 0 }),
  evs: available({ hp: 0 }),
  nature: unavailable,
  experience: available(0),
  friendship: available(0),
  gender: unavailable,
  shiny: available(false),
  pokerus: available(false),
};
const event = {
  type: "active",
  snapshot: {
    kind: "snapshot",
    schemaVersion: 2,
    observedAt: "2026-08-01T10:00:00Z",
    status: "active",
    party: [member],
    location: available({ name: "Route 1", mapId: unavailable }),
    battle: available({
      active: true,
      kind: "trainer",
      format: "single",
      player: [member],
      opponents: [member],
      trainer: unavailable,
      outcome: available("in_progress"),
    }),
    route: available({ name: "Route 1", trainers: [], completed: 0, total: 0 }),
    progress: available({
      romName: unavailable,
      gameCode: unavailable,
      trackerVersion: unavailable,
      timer: unavailable,
      paused: available(false),
      playtime: unavailable,
      badges: available([]),
      centreHeals: available(0),
      wildBattles: available(0),
      trainerBattles: available(0),
      fishing: available(0),
      rockSmash: available(0),
    }),
  },
};

test("the expanded channel remains operable at 640 CSS pixels", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 900 });
  await page.addInitScript((channelEvent) => {
    class FixtureSocket extends EventTarget {
      constructor() {
        super();
        window.setTimeout(() => {
          this.dispatchEvent(new Event("open"));
          this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(channelEvent) }));
        }, 0);
      }

      close() {
        this.dispatchEvent(new Event("close"));
      }
    }
    Object.assign(window, { WebSocket: FixtureSocket });
  }, event);
  await page.goto("/channel/00042");
  await expect(page.getByRole("region", { name: "Run overview" })).toBeVisible();
  await expect(page.getByText("Route 1").first()).toBeVisible();
  for (const panel of ["Party", "Battle", "Route", "Progress"]) {
    await expect(page.locator("summary", { hasText: panel })).toBeVisible();
  }
  await page.locator("summary", { hasText: "Party" }).click();
  await expect(page.getByText("Tackle").first()).toBeVisible();
  await expect(
    page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
  ).resolves.toBe(true);
});
