export const schemaVersion = 1 as const;
export const expandedSchemaVersion = 2 as const;

export type Available<T> =
  | { readonly availability: "available"; readonly value: T }
  | { readonly availability: "unavailable" };

export type PartyMember = {
  readonly id: string;
  readonly name: string;
  readonly types: Available<readonly string[]>;
  readonly ivs: Available<Readonly<Record<string, number>>>;
  readonly evs: Available<Readonly<Record<string, number>>>;
  readonly stats: Available<Readonly<Record<string, number>>>;
  readonly moves: Available<readonly string[]>;
};

export type RouteTrainer = {
  readonly id: string;
  readonly name: string;
  readonly battled: Available<boolean>;
};

export type LegacyRunSnapshot = {
  readonly kind: "snapshot";
  readonly schemaVersion: typeof schemaVersion;
  readonly observedAt: string;
  readonly status: string;
  readonly party: readonly PartyMember[];
  readonly route: Available<{
    readonly name: string;
    readonly trainers: readonly RouteTrainer[];
    readonly completed: number;
    readonly total: number;
  }>;
};

export type ExpandedMove = {
  readonly id: string;
  readonly name: string;
  readonly pp: Available<number>;
};

export type ExpandedPartyMember = {
  readonly id: string;
  readonly name: string;
  readonly speciesId: Available<string>;
  readonly level: Available<number>;
  readonly currentHp: Available<number>;
  readonly maximumHp: Available<number>;
  readonly types: Available<readonly string[]>;
  readonly status: Available<string>;
  readonly ability: Available<string>;
  readonly heldItem: Available<string>;
  readonly moves: Available<readonly ExpandedMove[]>;
  readonly stats: Available<Readonly<Record<string, number>>>;
  readonly statStages: Available<Readonly<Record<string, number>>>;
  readonly ivs: Available<Readonly<Record<string, number>>>;
  readonly evs: Available<Readonly<Record<string, number>>>;
  readonly nature: Available<string>;
  readonly experience: Available<number>;
  readonly friendship: Available<number>;
  readonly gender: Available<string>;
  readonly shiny: Available<boolean>;
  readonly pokerus: Available<boolean>;
};

export type ExpandedTrainer = {
  readonly id: string;
  readonly name: string;
  readonly trainerClass: Available<string>;
  readonly portraitId: Available<string>;
  readonly battled: Available<boolean>;
  readonly party: Available<readonly ExpandedPartyMember[]>;
  readonly battleItems: Available<readonly string[]>;
  readonly doubleBattle: Available<boolean>;
};

export type BattleState =
  | { readonly active: false }
  | {
      readonly active: true;
      readonly kind: "wild" | "trainer";
      readonly format: "single" | "double";
      readonly player: readonly ExpandedPartyMember[];
      readonly opponents: readonly ExpandedPartyMember[];
      readonly trainer: Available<ExpandedTrainer>;
      readonly outcome: Available<"in_progress" | "won" | "lost" | "fled" | "caught">;
    };

export type ExpandedRunSnapshot = {
  readonly kind: "snapshot";
  readonly schemaVersion: typeof expandedSchemaVersion;
  readonly observedAt: string;
  readonly status: string;
  readonly party: readonly ExpandedPartyMember[];
  readonly location: Available<{ readonly name: string; readonly mapId: Available<string> }>;
  readonly battle: Available<BattleState>;
  readonly route: Available<{
    readonly name: string;
    readonly trainers: readonly ExpandedTrainer[];
    readonly completed: number;
    readonly total: number;
  }>;
  readonly progress: Available<{
    readonly romName: Available<string>;
    readonly gameCode: Available<string>;
    readonly trackerVersion: Available<string>;
    readonly timer: Available<string>;
    readonly paused: Available<boolean>;
    readonly playtime: Available<string>;
    readonly badges: Available<readonly string[]>;
    readonly centreHeals: Available<number>;
    readonly wildBattles: Available<number>;
    readonly trainerBattles: Available<number>;
    readonly fishing: Available<number>;
    readonly rockSmash: Available<number>;
  }>;
};

export type RunSnapshot = LegacyRunSnapshot | ExpandedRunSnapshot;

export type LegacyHeartbeat = {
  readonly kind: "heartbeat";
  readonly schemaVersion: typeof schemaVersion;
  readonly observedAt: string;
};

export type ExpandedHeartbeat = {
  readonly kind: "heartbeat";
  readonly schemaVersion: typeof expandedSchemaVersion;
  readonly observedAt: string;
};

export type Heartbeat = LegacyHeartbeat | ExpandedHeartbeat;

export type LegacyUnsupported = {
  readonly kind: "unsupported";
  readonly schemaVersion: typeof schemaVersion;
  readonly observedAt: string;
  readonly reason: string;
};

export type ExpandedUnsupported = {
  readonly kind: "unsupported";
  readonly schemaVersion: typeof expandedSchemaVersion;
  readonly observedAt: string;
  readonly reason: string;
};

export type Unsupported = LegacyUnsupported | ExpandedUnsupported;
export type TrackerMessage = RunSnapshot | Heartbeat | Unsupported;

export type Publication = { readonly sessionId: string; readonly message: TrackerMessage };
export type ChannelEvent =
  { readonly type: "active"; readonly snapshot: RunSnapshot } | { readonly type: "inactive" };

export class ContractError extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const requiredString = (record: Record<string, unknown>, key: string) => {
  const value = record[key];
  if (typeof value !== "string" || value.length === 0) {
    throw new ContractError(`${key} must be a non-empty string`);
  }
  return value;
};

const parseObservedAt = (record: Record<string, unknown>) => {
  const observedAt = requiredString(record, "observedAt");
  if (Number.isNaN(Date.parse(observedAt))) {
    throw new ContractError("observedAt must be an ISO-compatible timestamp");
  }
  return observedAt;
};

const parseSchemaVersion = (record: Record<string, unknown>) => {
  if (record.schemaVersion === schemaVersion || record.schemaVersion === expandedSchemaVersion) {
    return record.schemaVersion;
  }
  throw new ContractError(`unsupported schema version: ${String(record.schemaVersion)}`);
};

const parseAvailable = <T>(value: unknown, parseValue: (candidate: unknown) => T): Available<T> => {
  if (!isRecord(value)) throw new ContractError("availability wrapper must be an object");
  if (value.availability === "unavailable") return { availability: "unavailable" };
  if (value.availability !== "available") {
    throw new ContractError("availability must be available or unavailable");
  }
  return { availability: "available", value: parseValue(value.value) };
};

const parseStringArray = (value: unknown) => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new ContractError("value must be an array of strings");
  }
  return value;
};

const parseNumber = (value: unknown) => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new ContractError("value must be a finite number");
  }
  return value;
};

const parseBoolean = (value: unknown) => {
  if (typeof value !== "boolean") throw new ContractError("value must be boolean");
  return value;
};

const parseNumberRecord = (value: unknown) => {
  if (!isRecord(value) || !Object.values(value).every((item) => typeof item === "number")) {
    throw new ContractError("value must be a numeric record");
  }
  return value as Readonly<Record<string, number>>;
};

const parsePartyMember = (value: unknown): PartyMember => {
  if (!isRecord(value)) throw new ContractError("party member must be an object");
  return {
    id: requiredString(value, "id"),
    name: requiredString(value, "name"),
    types: parseAvailable(value.types, parseStringArray),
    ivs: parseAvailable(value.ivs, parseNumberRecord),
    evs: parseAvailable(value.evs, parseNumberRecord),
    stats: parseAvailable(value.stats, parseNumberRecord),
    moves: parseAvailable(value.moves, parseStringArray),
  };
};

const parseRouteTrainer = (value: unknown): RouteTrainer => {
  if (!isRecord(value)) throw new ContractError("trainer must be an object");
  return {
    id: requiredString(value, "id"),
    name: requiredString(value, "name"),
    battled: parseAvailable(value.battled, parseBoolean),
  };
};

const parseLegacyRoute = (value: unknown) => {
  if (!isRecord(value) || !Array.isArray(value.trainers)) {
    throw new ContractError("route must include trainers");
  }
  const completed = value.completed;
  const total = value.total;
  if (!Number.isInteger(completed) || !Number.isInteger(total)) {
    throw new ContractError("route counts must be integers");
  }
  return {
    name: requiredString(value, "name"),
    trainers: value.trainers.map(parseRouteTrainer),
    completed: completed as number,
    total: total as number,
  };
};

const parseExpandedMove = (value: unknown): ExpandedMove => {
  if (!isRecord(value)) throw new ContractError("move must be an object");
  return {
    id: requiredString(value, "id"),
    name: requiredString(value, "name"),
    pp: parseAvailable(value.pp, parseNumber),
  };
};

const parseExpandedPartyMember = (value: unknown): ExpandedPartyMember => {
  if (!isRecord(value)) throw new ContractError("expanded party member must be an object");
  return {
    id: requiredString(value, "id"),
    name: requiredString(value, "name"),
    speciesId: parseAvailable(value.speciesId, requiredStringValue),
    level: parseAvailable(value.level, parseNumber),
    currentHp: parseAvailable(value.currentHp, parseNumber),
    maximumHp: parseAvailable(value.maximumHp, parseNumber),
    types: parseAvailable(value.types, parseStringArray),
    status: parseAvailable(value.status, requiredStringValue),
    ability: parseAvailable(value.ability, requiredStringValue),
    heldItem: parseAvailable(value.heldItem, requiredStringValue),
    moves: parseAvailable(value.moves, parseExpandedMoveArray),
    stats: parseAvailable(value.stats, parseNumberRecord),
    statStages: parseAvailable(value.statStages, parseNumberRecord),
    ivs: parseAvailable(value.ivs, parseNumberRecord),
    evs: parseAvailable(value.evs, parseNumberRecord),
    nature: parseAvailable(value.nature, requiredStringValue),
    experience: parseAvailable(value.experience, parseNumber),
    friendship: parseAvailable(value.friendship, parseNumber),
    gender: parseAvailable(value.gender, requiredStringValue),
    shiny: parseAvailable(value.shiny, parseBoolean),
    pokerus: parseAvailable(value.pokerus, parseBoolean),
  };
};

const requiredStringValue = (value: unknown) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new ContractError("value must be a non-empty string");
  }
  return value;
};

const parseExpandedMoveArray = (value: unknown) => {
  if (!Array.isArray(value)) throw new ContractError("value must be an array");
  return value.map(parseExpandedMove);
};

const parseExpandedPartyArray = (value: unknown) => {
  if (!Array.isArray(value)) throw new ContractError("value must be an array");
  return value.map(parseExpandedPartyMember);
};

const parseExpandedTrainer = (value: unknown): ExpandedTrainer => {
  if (!isRecord(value)) throw new ContractError("expanded trainer must be an object");
  return {
    id: requiredString(value, "id"),
    name: requiredString(value, "name"),
    trainerClass: parseAvailable(value.trainerClass, requiredStringValue),
    portraitId: parseAvailable(value.portraitId, requiredStringValue),
    battled: parseAvailable(value.battled, parseBoolean),
    party: parseAvailable(value.party, parseExpandedPartyArray),
    battleItems: parseAvailable(value.battleItems, parseStringArray),
    doubleBattle: parseAvailable(value.doubleBattle, parseBoolean),
  };
};

const parseBattleState = (value: unknown): BattleState => {
  if (!isRecord(value)) throw new ContractError("battle state must be an object");
  if (value.active === false) return { active: false };
  if (value.active !== true) throw new ContractError("battle active must be boolean");
  if (value.kind !== "wild" && value.kind !== "trainer") {
    throw new ContractError("battle kind must be wild or trainer");
  }
  if (value.format !== "single" && value.format !== "double") {
    throw new ContractError("battle format must be single or double");
  }
  if (!Array.isArray(value.player) || !Array.isArray(value.opponents)) {
    throw new ContractError("active battle must include combatants");
  }
  return {
    active: true,
    kind: value.kind,
    format: value.format,
    player: value.player.map(parseExpandedPartyMember),
    opponents: value.opponents.map(parseExpandedPartyMember),
    trainer: parseAvailable(value.trainer, parseExpandedTrainer),
    outcome: parseAvailable(value.outcome, (candidate) => {
      if (
        candidate !== "in_progress" &&
        candidate !== "won" &&
        candidate !== "lost" &&
        candidate !== "fled" &&
        candidate !== "caught"
      ) {
        throw new ContractError("battle outcome is invalid");
      }
      return candidate;
    }),
  };
};

const parseExpandedRoute = (value: unknown) => {
  if (!isRecord(value) || !Array.isArray(value.trainers)) {
    throw new ContractError("expanded route must include trainers");
  }
  if (!Number.isInteger(value.completed) || !Number.isInteger(value.total)) {
    throw new ContractError("route counts must be integers");
  }
  return {
    name: requiredString(value, "name"),
    trainers: value.trainers.map(parseExpandedTrainer),
    completed: value.completed as number,
    total: value.total as number,
  };
};

const parseExpandedProgress = (value: unknown) => {
  if (!isRecord(value)) throw new ContractError("progress must be an object");
  return {
    romName: parseAvailable(value.romName, requiredStringValue),
    gameCode: parseAvailable(value.gameCode, requiredStringValue),
    trackerVersion: parseAvailable(value.trackerVersion, requiredStringValue),
    timer: parseAvailable(value.timer, requiredStringValue),
    paused: parseAvailable(value.paused, parseBoolean),
    playtime: parseAvailable(value.playtime, requiredStringValue),
    badges: parseAvailable(value.badges, parseStringArray),
    centreHeals: parseAvailable(value.centreHeals, parseNumber),
    wildBattles: parseAvailable(value.wildBattles, parseNumber),
    trainerBattles: parseAvailable(value.trainerBattles, parseNumber),
    fishing: parseAvailable(value.fishing, parseNumber),
    rockSmash: parseAvailable(value.rockSmash, parseNumber),
  };
};

const parseLegacySnapshot = (
  record: Record<string, unknown>,
  observedAt: string,
): LegacyRunSnapshot => {
  if (!Array.isArray(record.party)) throw new ContractError("snapshot must include party");
  return {
    kind: "snapshot",
    schemaVersion,
    observedAt,
    status: requiredString(record, "status"),
    party: record.party.map(parsePartyMember),
    route: parseAvailable(record.route, parseLegacyRoute),
  };
};

const parseExpandedSnapshot = (
  record: Record<string, unknown>,
  observedAt: string,
): ExpandedRunSnapshot => {
  if (!Array.isArray(record.party)) throw new ContractError("snapshot must include party");
  return {
    kind: "snapshot",
    schemaVersion: expandedSchemaVersion,
    observedAt,
    status: requiredString(record, "status"),
    party: record.party.map(parseExpandedPartyMember),
    location: parseAvailable(record.location, (value) => {
      if (!isRecord(value)) throw new ContractError("location must be an object");
      return {
        name: requiredString(value, "name"),
        mapId: parseAvailable(value.mapId, requiredStringValue),
      };
    }),
    battle: parseAvailable(record.battle, parseBattleState),
    route: parseAvailable(record.route, parseExpandedRoute),
    progress: parseAvailable(record.progress, parseExpandedProgress),
  };
};

export const parseTrackerMessage = (value: unknown): TrackerMessage => {
  if (!isRecord(value)) throw new ContractError("message must be an object");
  const version = parseSchemaVersion(value);
  const observedAt = parseObservedAt(value);
  if (value.kind === "heartbeat") return { kind: "heartbeat", schemaVersion: version, observedAt };
  if (value.kind === "unsupported") {
    return {
      kind: "unsupported",
      schemaVersion: version,
      observedAt,
      reason: requiredString(value, "reason"),
    };
  }
  if (value.kind !== "snapshot")
    throw new ContractError("kind must be snapshot, heartbeat, or unsupported");
  return version === schemaVersion
    ? parseLegacySnapshot(value, observedAt)
    : parseExpandedSnapshot(value, observedAt);
};

export const parsePublication = (value: unknown): Publication => {
  if (!isRecord(value)) throw new ContractError("publication must be an object");
  return {
    sessionId: requiredString(value, "sessionId"),
    message: parseTrackerMessage(value.message),
  };
};

export const parseChannelEvent = (value: unknown): ChannelEvent => {
  if (!isRecord(value)) throw new ContractError("channel event must be an object");
  if (value.type === "inactive") return { type: "inactive" };
  if (value.type !== "active")
    throw new ContractError("channel event type must be active or inactive");
  const snapshot = parseTrackerMessage(value.snapshot);
  if (snapshot.kind !== "snapshot")
    throw new ContractError("active channel event must include snapshot");
  return { type: "active", snapshot };
};

export const isChannelCode = (value: string) => /^\d{5}$/.test(value);
