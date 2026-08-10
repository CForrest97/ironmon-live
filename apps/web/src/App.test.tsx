// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { LegacyRunSnapshot } from "@ironmon-live/contracts";
import { App, ExpandedRunView, LegacyRunView, RunView, trainerPortraitUrl } from "./App";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

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
  ability: available("Overgrow"),
  heldItem: unavailable,
  moves: available([{ id: "tackle", name: "Tackle", pp: available(35) }]),
  stats: available({ hp: 20, atk: 10, def: 10, spa: 15, spd: 10, spe: 10 }),
  baseStats: available({ spe: 45, spa: 65, hp: 45, spd: 65, def: 49, atk: 49 }),
  statStages: available({ atk: 0 }),
  ivs: available({ hp: 0 }),
  evs: available({ hp: 0 }),
  nature: available("Modest"),
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

const legacyActiveEmptyPartySnapshot = {
  kind: "snapshot",
  schemaVersion: 1,
  observedAt: "2026-08-01T10:00:00Z",
  status: "active",
  party: [],
  route: unavailable,
} satisfies LegacyRunSnapshot;

describe("expanded run dashboard", () => {
  it("shows party health, types, moves, and badge state in the overview without opening a panel", () => {
    const { container } = render(<ExpandedRunView snapshot={snapshot()} />);
    const overview = screen.getByRole("region", { name: "Run overview" });
    const overviewCards = [...container.querySelectorAll<HTMLElement>(".overview-card")];
    expect(overviewCards[0]).toHaveClass("overview-card-party");
    expect(overviewCards).toHaveLength(1);
    const overviewSections = [...overview.children];
    expect(overviewSections[0]).toHaveClass("overview-card-party");
    expect(overviewSections[1]).toHaveClass("current-focus");
    expect(overviewSections[2]).toHaveClass("overview-status-badges");
    expect([...overview.querySelectorAll("h2")].map((heading) => heading.textContent)).toEqual([
      "Party overview",
      "Badges",
    ]);
    expect(overview).toHaveTextContent("trainer battle · single");
    expect(overview).toHaveTextContent("Route contextRoute 10/1 trainers");
    expect(overview).toHaveTextContent("Bulbasaur");
    expect(overview).toHaveTextContent("12/20 HP");
    expect(overview).toHaveTextContent("grass");
    expect(overview).toHaveTextContent("AbilityOvergrow");
    expect(overview).toHaveTextContent("Tackle");
    expect(overview).toHaveTextContent("Modest");
    expect(overview).toHaveTextContent("BST");
    expect(overview).toHaveTextContent("318");
    expect(overview).toHaveTextContent("No badges yet");
    const partySummary = overview.querySelector(".overview-party-info");
    expect(partySummary?.querySelector(".overview-party-identity")).toHaveTextContent(
      "BulbasaurModest▲SpA▼Atkgrass",
    );
    expect(partySummary?.querySelector(".overview-party-traits")).toHaveTextContent(
      "AbilityOvergrowTackle",
    );
    expect(partySummary?.querySelector(".base-stat-strip")).toBeInTheDocument();
    ["Party details", "Battle details", "Route trainers", "Run progress"].forEach((panel) => {
      expect(screen.getByRole("button", { name: new RegExp(panel, "u") })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Party details/u }));
    expect(screen.getAllByText(/Tackle/u)[0]).toBeInTheDocument();
  });

  it("states when the overview has no party yet", () => {
    render(<ExpandedRunView snapshot={{ ...snapshot(false), party: [] }} />);

    expect(screen.getByRole("region", { name: "Run overview" })).toHaveTextContent("No party yet");
  });

  it("styles reported condition codes as game-like badges without changing their wording", () => {
    const poisoned = { ...member, status: available("PSN") };
    render(<ExpandedRunView snapshot={{ ...snapshot(false), party: [poisoned] }} />);

    const overview = screen.getByRole("region", { name: "Run overview" });
    const badge = overview.querySelector(".condition-poisoned");
    expect(badge).toHaveTextContent("PSN");
    expect(badge).toBeVisible();
  });

  it("uses the type-tag typography and container for healthy state", () => {
    render(<ExpandedRunView snapshot={snapshot(false)} />);

    const badge = screen
      .getByRole("region", { name: "Run overview" })
      .querySelector(".condition-healthy");
    expect(badge).toHaveTextContent("healthy");
    expect(badge).toHaveClass("tag");
  });

  it("also shows badges inside the Progress panel", () => {
    render(<ExpandedRunView snapshot={snapshot(true, ["Boulder"])} />);
    expect(screen.getByRole("region", { name: "Run overview" })).toHaveTextContent("Boulder");
    fireEvent.click(screen.getByRole("button", { name: /Run progress/u }));
    expect(screen.getAllByText("Boulder")).toHaveLength(2);
    expect(screen.getByRole("region", { name: "Current focus" })).toHaveTextContent(
      "trainer battle · single",
    );
    expect(screen.getByRole("group", { name: "Route context" })).toHaveTextContent(
      "Route 10/1 trainers",
    );
  });

  it("keeps detail controls closed until the player chooses one and makes their contents explicit", () => {
    render(<ExpandedRunView snapshot={snapshot(false)} />);

    const party = screen.getByRole("button", { name: /Show Party details/u });
    expect(party).toHaveAttribute("aria-expanded", "false");
    expect(party).toHaveTextContent("Moves, stats, IVs, EVs, and condition");
    expect(party).toHaveTextContent("⌄");
    expect(screen.getByRole("button", { name: "Show route details" })).toBeVisible();
  });

  it("uses route as the initial focus outside battle and battle as the initial focus during battle", () => {
    const { rerender } = render(<ExpandedRunView snapshot={snapshot(false)} />);
    expect(screen.getByRole("region", { name: "Current focus" })).toHaveTextContent("Route 1");
    expect(screen.getByRole("button", { name: "Show route details" })).toBeVisible();

    rerender(<ExpandedRunView snapshot={snapshot()} />);
    expect(screen.getByRole("region", { name: "Current focus" })).toHaveTextContent(
      "trainer battle · single",
    );
    expect(screen.getByRole("group", { name: "Route context" })).toHaveTextContent(
      "Route 10/1 trainers",
    );
    expect(screen.getByRole("button", { name: "Show battle details" })).toBeVisible();
  });

  it("keeps route focus when the party changes or another detail panel opens", () => {
    const inactive = snapshot(false);
    const { rerender } = render(<ExpandedRunView snapshot={inactive} />);
    const newMember = { ...member, id: "2", name: "Charmander" };

    rerender(<ExpandedRunView snapshot={{ ...inactive, party: [member, newMember] }} />);

    const focus = screen.getByRole("region", { name: "Current focus" });
    expect(focus).toHaveTextContent("Route 1");
    expect(focus).not.toHaveTextContent("Party updated");

    fireEvent.click(screen.getByRole("button", { name: /Party details/u }));
    expect(focus).toHaveTextContent("Route 1");
    expect(screen.getByRole("button", { name: "Show route details" })).toBeVisible();
  });

  it("keeps only one panel open at a time", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: /Party details/u }));
    expect(screen.getByRole("button", { name: /Party details/u })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /Route trainers/u }));
    expect(screen.getByRole("button", { name: /Party details/u })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(screen.getByRole("button", { name: /Route trainers/u })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  it("reveals every reported party field when Party details opens", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: /Party details/u }));
    expect(screen.getAllByText("Stats")[0]).toBeVisible();
    expect(screen.queryByText("More details")).not.toBeInTheDocument();
  });

  it("highlights the nature-boosted and nature-lowered stat rows", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: /Party details/u }));
    expect(screen.getAllByText("spa")[0]?.closest("div")).toHaveClass("stat-boosted");
    expect(screen.getAllByText("atk")[0]?.closest("div")).toHaveClass("stat-lowered");
  });

  it("shows the species base stat total as the mon's potential", () => {
    const { container } = render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: /Party details/u }));
    expect(screen.getAllByText("318")[0]).toBeInTheDocument();
    expect([...container.querySelectorAll(".bst-label")].map((label) => label.textContent)).toEqual(
      ["HP", "Atk", "Def", "SpA", "SpD", "Spe"],
    );
  });

  it("does not reserve battle overview or detail content for an inactive battle", () => {
    render(<ExpandedRunView snapshot={snapshot(false)} />);
    expect(screen.queryByRole("button", { name: /Battle details/u })).not.toBeInTheDocument();
    const overview = screen.getByRole("region", { name: "Run overview" });
    expect(overview).toHaveTextContent("Route 1");
    expect(overview).not.toHaveTextContent("No active battle");
  });

  it("does not render trainer markers or rows beyond the reported route total", () => {
    const run = snapshot(false);
    const { container } = render(
      <ExpandedRunView
        snapshot={{
          ...run,
          route: available({ ...run.route.value, total: 0 }),
        }}
      />,
    );

    expect(container.querySelectorAll(".progress-step")).toHaveLength(0);
    expect(container.querySelectorAll(".progress-track")).toHaveLength(0);
    fireEvent.click(screen.getByRole("button", { name: /Route trainers/u }));
    expect(container.querySelectorAll(".progress-step")).toHaveLength(0);
    expect(container.querySelectorAll(".progress-track")).toHaveLength(0);
    expect(container.querySelectorAll(".trainer-row")).toHaveLength(0);
  });

  it("falls back to readable text when a sprite fails", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.error(screen.getAllByAltText("Bulbasaur sprite")[0] as HTMLImageElement);
    expect(screen.getAllByText("BU")[0]).toBeInTheDocument();
  });

  it("falls back to initials when a trainer portrait is unavailable", () => {
    render(<ExpandedRunView snapshot={snapshot()} />);
    fireEvent.click(screen.getByRole("button", { name: /Route trainers/u }));
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
    fireEvent.click(screen.getByRole("button", { name: /Route trainers/u }));
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

describe("empty-party active-run ball prompt", () => {
  it("shows one stable random highlight in the expanded view", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const run = { ...snapshot(false), party: [] };
    const { container, rerender } = render(<ExpandedRunView snapshot={run} />);

    expect(screen.getByRole("heading", { name: "A first pick, just for fun" })).toBeVisible();
    expect(screen.getByRole("list", { name: "Starter ball choices" })).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    for (const position of ["Left", "Centre", "Right"]) {
      expect(screen.getByText(position)).toBeVisible();
    }
    expect(screen.getByText("Random highlight")).toBeVisible();

    const choices = [...container.querySelectorAll<HTMLElement>(".starter-ball-choice")];
    expect(choices).toHaveLength(3);
    expect(choices[1]).toHaveClass("starter-ball-choice-highlighted");
    expect(
      choices.filter((choice) => choice.classList.contains("starter-ball-choice-unselected")),
    ).toHaveLength(2);

    rerender(<ExpandedRunView snapshot={{ ...run, observedAt: "2026-08-01T10:00:01Z" }} />);
    expect(random).toHaveBeenCalledOnce();
    expect(choices[1]).toHaveClass("starter-ball-choice-highlighted");
  });

  it("shows the same prompt for a legacy active snapshot", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<LegacyRunView snapshot={legacyActiveEmptyPartySnapshot} />);

    expect(screen.getByRole("heading", { name: "A first pick, just for fun" })).toBeVisible();
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Left").closest("li")).toHaveClass("starter-ball-choice-highlighted");
  });

  it("keeps the highlight through an active empty-party schema transition", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const expandedRun = { ...snapshot(false), party: [] };
    const { rerender } = render(<RunView snapshot={expandedRun} />);
    expect(screen.getByText("Centre").closest("li")).toHaveClass("starter-ball-choice-highlighted");

    rerender(
      <RunView
        snapshot={{ ...legacyActiveEmptyPartySnapshot, observedAt: "2026-08-01T10:00:01Z" }}
      />,
    );
    expect(random).toHaveBeenCalledOnce();
    expect(screen.getByText("Centre").closest("li")).toHaveClass("starter-ball-choice-highlighted");
  });

  it("hides the prompt outside an empty-party active-run episode", () => {
    const run = { ...snapshot(false), party: [] };
    const { rerender } = render(<ExpandedRunView snapshot={run} />);
    expect(screen.getByRole("heading", { name: "A first pick, just for fun" })).toBeVisible();

    rerender(<ExpandedRunView snapshot={{ ...run, party: [member] }} />);
    expect(screen.queryByRole("heading", { name: "A first pick, just for fun" })).toBeNull();

    for (const status of ["startup", "battle", "game_over", "completed"]) {
      rerender(<ExpandedRunView snapshot={{ ...run, status }} />);
      expect(screen.queryByRole("heading", { name: "A first pick, just for fun" })).toBeNull();
    }
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
