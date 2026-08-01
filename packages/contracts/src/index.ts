export const schemaVersion = 1 as const;

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

export type RunSnapshot = {
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

export type Heartbeat = {
  readonly kind: "heartbeat";
  readonly schemaVersion: typeof schemaVersion;
  readonly observedAt: string;
};

export type Unsupported = {
  readonly kind: "unsupported";
  readonly schemaVersion: typeof schemaVersion;
  readonly observedAt: string;
  readonly reason: string;
};

export type TrackerMessage = RunSnapshot | Heartbeat | Unsupported;

export type Publication = {
  readonly sessionId: string;
  readonly message: TrackerMessage;
};

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

const assertVersion = (record: Record<string, unknown>) => {
  if (record.schemaVersion !== schemaVersion) {
    throw new ContractError(`unsupported schema version: ${String(record.schemaVersion)}`);
  }
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

const parseTrainer = (value: unknown): RouteTrainer => {
  if (!isRecord(value)) throw new ContractError("trainer must be an object");
  return {
    id: requiredString(value, "id"),
    name: requiredString(value, "name"),
    battled: parseAvailable(value.battled, (candidate) => {
      if (typeof candidate !== "boolean") throw new ContractError("battled must be boolean");
      return candidate;
    }),
  };
};

const parseRoute = (value: unknown) => {
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
    trainers: value.trainers.map(parseTrainer),
    completed: completed as number,
    total: total as number,
  };
};

export const parseTrackerMessage = (value: unknown): TrackerMessage => {
  if (!isRecord(value)) throw new ContractError("message must be an object");
  assertVersion(value);
  const observedAt = parseObservedAt(value);
  if (value.kind === "heartbeat") return { kind: "heartbeat", schemaVersion, observedAt };
  if (value.kind === "unsupported") {
    return {
      kind: "unsupported",
      schemaVersion,
      observedAt,
      reason: requiredString(value, "reason"),
    };
  }
  if (value.kind !== "snapshot" || !Array.isArray(value.party)) {
    throw new ContractError("kind must be snapshot, heartbeat, or unsupported");
  }
  return {
    kind: "snapshot",
    schemaVersion,
    observedAt,
    status: requiredString(value, "status"),
    party: value.party.map(parsePartyMember),
    route: parseAvailable(value.route, parseRoute),
  };
};

export const parsePublication = (value: unknown): Publication => {
  if (!isRecord(value)) throw new ContractError("publication must be an object");
  return {
    sessionId: requiredString(value, "sessionId"),
    message: parseTrackerMessage(value.message),
  };
};

export const isChannelCode = (value: string) => /^\d{5}$/.test(value);
