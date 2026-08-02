// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ExpandedRunView } from "./App";

afterEach(cleanup);

const available = <T,>(value: T) => ({ availability: "available" as const, value });
const unavailable = { availability: "unavailable" as const };
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
} as const;

const snapshot = (active = true) => ({
  kind: "snapshot" as const,
  schemaVersion: 2 as const,
  observedAt: "2026-08-01T10:00:00Z",
  status: "active",
  party: [member],
  location: available({ name: "Route 1", mapId: unavailable }),
  battle: available(
    active
      ? {
          active: true as const,
          kind: "trainer" as const,
          format: "single" as const,
          player: [member],
          opponents: [member],
          trainer: unavailable,
          outcome: available("in_progress" as const),
        }
      : { active: false as const },
  ),
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
});

describe("expanded run dashboard", () => {
  it("keeps the overview visible and exposes each detail panel", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    expect(screen.getByRole("region", { name: "Run overview" })).toHaveTextContent("Route 1");
    expect(screen.getByText("Party readiness")).toBeInTheDocument();
    ["Party", "Battle", "Route", "Progress"].forEach((panel) => {
      expect(screen.getByText(panel, { selector: "summary" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText("Party", { selector: "summary" }));
    expect(screen.getAllByText(/Tackle/u)[0]).toBeInTheDocument();
  });

  it("does not reserve a battle panel for an inactive battle", () => {
    render(<ExpandedRunView snapshot={snapshot(false)} />);
    expect(screen.queryByText("Battle", { selector: "summary" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Run overview" })).toHaveTextContent(
      "No active battle",
    );
  });

  it("falls back to readable text when a sprite fails", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.error(screen.getAllByAltText("Bulbasaur sprite")[0] as HTMLImageElement);
    expect(screen.getAllByText("BU")[0]).toBeInTheDocument();
  });
});
