// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App, ExpandedRunView, trainerPortraitUrl } from "./App";

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

const snapshot = (active = true, badges: readonly string[] = []) => ({
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
  route: available({
    name: "Route 1",
    trainers: [
      {
        id: "t1",
        name: "R1 Trainer",
        trainerClass: unavailable,
        portraitId: unavailable,
        battled: available(false),
        party: unavailable,
        battleItems: unavailable,
        doubleBattle: unavailable,
      },
    ],
    completed: 0,
    total: 1,
  }),
  progress: available({
    romName: unavailable,
    gameCode: unavailable,
    trackerVersion: unavailable,
    timer: unavailable,
    paused: available(false),
    playtime: unavailable,
    badges: available(badges),
    centreHeals: available(0),
    wildBattles: available(0),
    trainerBattles: available(0),
    fishing: available(0),
    rockSmash: available(0),
  }),
});

describe("expanded run dashboard", () => {
  it("shows party HP and badge state in the overview without opening a panel", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    const overview = screen.getByRole("region", { name: "Run overview" });
    expect(overview).toHaveTextContent("Route 1");
    expect(overview).toHaveTextContent("Bulbasaur");
    expect(overview).toHaveTextContent("12/20 HP");
    expect(overview).toHaveTextContent("No badges yet");
    ["Party", "Battle", "Route", "Progress"].forEach((panel) => {
      expect(screen.getByRole("button", { name: panel })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: "Party" }));
    expect(screen.getAllByText(/Tackle/u)[0]).toBeInTheDocument();
  });

  it("also shows badges inside the Progress panel", () => {
    render(<ExpandedRunView snapshot={snapshot(true, ["Boulder"])} />);
    expect(screen.getByRole("region", { name: "Run overview" })).toHaveTextContent("Boulder");
    fireEvent.click(screen.getByRole("button", { name: "Progress" }));
    expect(screen.getAllByText("Boulder")).toHaveLength(2);
  });

  it("keeps only one panel open at a time", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: "Party" }));
    expect(screen.getByRole("button", { name: "Party" })).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(screen.getByRole("button", { name: "Route" }));
    expect(screen.getByRole("button", { name: "Party" })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Route" })).toHaveAttribute("aria-expanded", "true");
  });

  it("hides deep party stats behind a more-details disclosure", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: "Party" }));
    expect(screen.getByText("Stat stages")).not.toBeVisible();
    fireEvent.click(screen.getByText("More details"));
    expect(screen.getByText("Stat stages")).toBeVisible();
  });

  it("does not reserve a battle panel for an inactive battle", () => {
    render(<ExpandedRunView snapshot={snapshot(false)} />);
    expect(screen.queryByRole("button", { name: "Battle" })).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Run overview" })).toHaveTextContent(
      "No active battle",
    );
  });

  it("falls back to readable text when a sprite fails", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.error(screen.getAllByAltText("Bulbasaur sprite")[0] as HTMLImageElement);
    expect(screen.getAllByText("BU")[0]).toBeInTheDocument();
  });

  it("falls back to initials when a trainer portrait is unavailable", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: "Route" }));
    expect(screen.getAllByText("R1")[0]).toBeInTheDocument();
  });

  it("renders a Showdown trainer portrait when the producer supplies a safe slug", () => {
    const run = snapshot();
    const routeTrainer = run.route.value.trainers.at(0);
    if (!routeTrainer) throw new Error("test snapshot must include a route trainer");
    render(
      <ExpandedRunView
        snapshot={{
          ...run,
          route: available({
            ...run.route.value,
            trainers: [
              {
                ...routeTrainer,
                portraitId: available("acetrainer-gen3"),
              },
            ],
          }),
        }}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Route" }));
    expect(screen.getByAltText("R1 Trainer portrait")).toHaveAttribute(
      "src",
      "https://play.pokemonshowdown.com/sprites/trainers/acetrainer-gen3.png",
    );
  });

  it("does not resolve unsafe trainer portrait IDs", () => {
    expect(trainerPortraitUrl("acetrainer-gen3")).toBe(
      "https://play.pokemonshowdown.com/sprites/trainers/acetrainer-gen3.png",
    );
    expect(trainerPortraitUrl("../../untrusted")).toBeUndefined();
  });
});

describe("homepage active channels", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders active channels as links into their live view, with a lead preview", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            channels: [
              {
                code: "12345",
                preview: {
                  lead: available({ name: "Bulbasaur", speciesId: available("1") }),
                  location: available("Route 3"),
                  game: available("Pokemon FireRed"),
                },
              },
            ],
          }),
      }),
    );
    render(<App />);
    const link = await screen.findByRole("link", { name: /Channel 12345/ });
    expect(link).toHaveAttribute("href", "/channel/12345");
    expect(screen.getByText("Bulbasaur")).toBeInTheDocument();
    expect(screen.getByAltText("Bulbasaur sprite")).toHaveAttribute(
      "src",
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png",
    );
    expect(screen.getByText("Route 3 · Pokemon FireRed")).toBeInTheDocument();
  });

  it("shows an explicit empty state when no channels are active", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ channels: [] }) }),
    );
    render(<App />);
    expect(await screen.findByText("No channels are live right now.")).toBeInTheDocument();
    expect(screen.getByLabelText("Five-digit channel code")).toBeInTheDocument();
  });

  it("shows a waiting placeholder for a channel with no party data yet", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            channels: [
              {
                code: "54321",
                preview: {
                  lead: { availability: "unavailable" },
                  location: { availability: "unavailable" },
                  game: { availability: "unavailable" },
                },
              },
            ],
          }),
      }),
    );
    render(<App />);
    const link = await screen.findByRole("link", { name: /Channel 54321/ });
    expect(link).toHaveAttribute("href", "/channel/54321");
    expect(screen.getByText("Waiting for data")).toBeInTheDocument();
    expect(screen.queryByAltText(/sprite/)).not.toBeInTheDocument();
  });
});
