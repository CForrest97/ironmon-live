import {
  expandedSchemaVersion,
  type Available,
  type ExpandedPartyMember,
  type ExpandedRunSnapshot,
  type ExpandedTrainer,
  type LegacyRunSnapshot,
  type RunSnapshot,
  type TrackerMessage,
} from "@ironmon-live/contracts";

const available = <T>(value: T): Available<T> => ({ availability: "available", value });
const unavailable = (): Available<never> => ({ availability: "unavailable" });

const demoStats = { hp: 100, atk: 72, def: 64, spa: 81, spd: 68, spe: 75 } as const;
const demoStages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, accuracy: 0, evasion: 0 } as const;

const demoPartyMember = (id: string, name: string): ExpandedPartyMember => ({
  id,
  name,
  speciesId: available(id),
  level: available(36),
  currentHp: available(88),
  maximumHp: available(100),
  types: available(["normal"]),
  status: available("healthy"),
  ability: available("Overgrow"),
  heldItem: available("Sitrus Berry"),
  moves: available([
    { id: "tackle", name: "Tackle", pp: available(35) },
    { id: "growl", name: "Growl", pp: available(40) },
  ]),
  stats: available(demoStats),
  statStages: available(demoStages),
  ivs: available({ hp: 15, atk: 15, def: 15, spa: 15, spd: 15, spe: 15 }),
  evs: available({ hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }),
  nature: available("Hardy"),
  experience: available(42_000),
  friendship: available(70),
  gender: available("unknown"),
  shiny: available(false),
  pokerus: available(false),
});

const expandPartyMember = (member: LegacyRunSnapshot["party"][number]): ExpandedPartyMember => ({
  ...demoPartyMember(member.id, member.name),
  speciesId: available(member.id),
  types: member.types,
  ivs: member.ivs,
  evs: member.evs,
  stats: member.stats,
  moves:
    member.moves.availability === "available"
      ? available(
          member.moves.value.map((name, index) => ({
            id: `${member.id}-${String(index + 1)}`,
            name,
            pp: available(20),
          })),
        )
      : unavailable(),
});

const demoTrainer = (id: string, name: string, battled: Available<boolean>): ExpandedTrainer => ({
  id,
  name,
  trainerClass: available("Ace Trainer"),
  portraitId: unavailable(),
  battled,
  party: available([demoPartyMember("262", "Mightyena")]),
  battleItems: available(["Hyper Potion"]),
  doubleBattle: available(false),
});

const fallbackRoute = {
  name: "Sample Route",
  trainers: [demoTrainer("sample-trainer", "Ace Trainer Nova", available(false))],
  completed: 0,
  total: 1,
} as const;

export const expandLegacySnapshot = (snapshot: LegacyRunSnapshot): ExpandedRunSnapshot => {
  const party = snapshot.party.map(expandPartyMember);
  const route =
    snapshot.route.availability === "available"
      ? {
          name: snapshot.route.value.name,
          trainers: snapshot.route.value.trainers.map((trainer) =>
            demoTrainer(trainer.id, trainer.name, trainer.battled),
          ),
          completed: snapshot.route.value.completed,
          total: snapshot.route.value.total,
        }
      : fallbackRoute;

  return {
    kind: "snapshot",
    schemaVersion: expandedSchemaVersion,
    observedAt: snapshot.observedAt,
    status: snapshot.status,
    party,
    location: available({ name: route.name, mapId: unavailable() }),
    battle: available({
      active: true,
      kind: "trainer",
      format: "single",
      player: party.slice(0, 1),
      opponents: [demoPartyMember("262", "Mightyena")],
      trainer: available(demoTrainer("nova", "Ace Trainer Nova", available(false))),
      outcome: available("in_progress"),
    }),
    route: available(route),
    progress: available({
      romName: available("Sample ROM"),
      gameCode: available("DEMO"),
      trackerVersion: available("sample"),
      timer: available("01:23:45"),
      paused: available(false),
      playtime: available("12:34"),
      badges: available(["Boulder Badge", "Cascade Badge"]),
      centreHeals: available(3),
      wildBattles: available(12),
      trainerBattles: available(8),
      fishing: available(0),
      rockSmash: available(0),
    }),
  };
};

export const normalizeForPublication = (message: TrackerMessage): TrackerMessage =>
  message.kind === "snapshot" && message.schemaVersion === 1
    ? expandLegacySnapshot(message)
    : message;

export const snapshotSchemaVersion = (snapshot: RunSnapshot) => snapshot.schemaVersion;
