import { Fragment, useEffect, useState, type FormEvent, type ReactNode } from "react";
import type {
  Available,
  ChannelEvent,
  ExpandedPartyMember,
  ExpandedRunSnapshot,
  LegacyRunSnapshot,
  RunSnapshot,
} from "@ironmon-live/contracts";
import { fetchActiveChannels, subscribeToChannel } from "./channel.ts";
import { DownloadCompanion } from "./download.tsx";
import { SetupCompanion } from "./setup.tsx";
import { TopBar } from "./TopBar.tsx";

const Unavailable = () => <span className="unavailable">Unavailable</span>;
const availableValue = <T,>(value: Available<T>, render: (item: T) => ReactNode) =>
  value.availability === "available" ? render(value.value) : <Unavailable />;

const Values = ({ value }: { readonly value: Available<Readonly<Record<string, number>>> }) =>
  availableValue(value, (values) => (
    <dl className="values">
      {Object.entries(values).map(([label, amount]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{amount}</dd>
        </div>
      ))}
    </dl>
  ));

const TypeTags = ({ value }: { readonly value: Available<readonly string[]> }) =>
  availableValue(value, (types) =>
    types.length === 0 ? (
      <span>None</span>
    ) : (
      <div className="type-tags">
        {types.map((type) => (
          <span key={type} className={`tag tag-${type.toLowerCase()}`}>
            {type}
          </span>
        ))}
      </div>
    ),
  );

const BadgeChips = ({ value }: { readonly value: Available<readonly string[]> }) =>
  availableValue(value, (badges) =>
    badges.length === 0 ? (
      <span className="badge-count">No badges yet</span>
    ) : (
      <div className="badge-chips">
        {badges.map((badge) => (
          <span key={badge} className="badge-chip">
            {badge}
          </span>
        ))}
      </div>
    ),
  );

const HpBar = ({ member }: { readonly member: ExpandedPartyMember }) => {
  const { currentHp, maximumHp, status } = member;
  if (currentHp.availability !== "available" || maximumHp.availability !== "available") {
    return (
      <div className="hp-bar">
        <div className="hp-bar-label">
          <span>HP</span>
          <Unavailable />
        </div>
      </div>
    );
  }
  const current = currentHp.value;
  const maximum = maximumHp.value;
  const pct = maximum === 0 ? 0 : Math.max(0, Math.min(100, (current / maximum) * 100));
  const tone = pct > 50 ? "" : pct > 20 ? "hp-mid" : "hp-low";
  return (
    <div className="hp-bar">
      <div className="hp-bar-label">
        <span>{availableValue(status, (value) => value)}</span>
        <span className="hp-bar-value">
          {current}/{maximum} HP
        </span>
      </div>
      <div className="hp-bar-track">
        <div className={`hp-bar-fill ${tone}`} style={{ width: `${String(pct)}%` }} />
      </div>
    </div>
  );
};

const ProgressTrack = ({
  steps,
}: {
  readonly steps: ReadonlyArray<{ readonly name: string; readonly state: string }>;
}) => (
  <div className="progress-track">
    {steps.map((step, index) => (
      <Fragment key={step.name}>
        <div
          title={step.name}
          className={`progress-step ${step.state === "battled" ? "progress-defeated" : step.state === "current" ? "progress-current" : ""}`}
        />
        {index < steps.length - 1 && (
          <div
            className={`progress-connector ${step.state === "battled" ? "progress-defeated" : ""}`}
          />
        )}
      </Fragment>
    ))}
  </div>
);

export const pokemonSpriteUrl = (speciesId: string) =>
  `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${speciesId}.png`;

const validTrainerPortraitId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

export const trainerPortraitUrl = (portraitId: string) =>
  validTrainerPortraitId.test(portraitId)
    ? `https://play.pokemonshowdown.com/sprites/trainers/${portraitId}.png`
    : undefined;

const Sprite = ({ member }: { readonly member: ExpandedPartyMember }) => {
  const [failed, setFailed] = useState(false);
  if (failed || member.speciesId.availability === "unavailable") {
    return <span className="sprite-fallback">{member.name.slice(0, 2).toUpperCase()}</span>;
  }
  return (
    <img
      className="sprite"
      src={pokemonSpriteUrl(member.speciesId.value)}
      alt={`${member.name} sprite`}
      onError={() => {
        setFailed(true);
      }}
    />
  );
};

const TrainerPortrait = ({
  trainer,
}: {
  readonly trainer: { readonly portraitId: Available<string>; readonly name: string };
}) => {
  const [failed, setFailed] = useState(false);
  const source =
    trainer.portraitId.availability === "available"
      ? trainerPortraitUrl(trainer.portraitId.value)
      : undefined;
  if (failed || !source) {
    return (
      <span className="sprite-fallback trainer-fallback">
        {trainer.name.slice(0, 2).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      className="sprite trainer-portrait"
      src={source}
      alt={`${trainer.name} portrait`}
      onError={() => {
        setFailed(true);
      }}
    />
  );
};

const PartyDetails = ({ member }: { readonly member: ExpandedPartyMember }) => (
  <article className="party-card">
    <div className="card-heading">
      <Sprite member={member} />
      <div>
        <h3>{member.name}</h3>
        <TypeTags value={member.types} />
      </div>
    </div>
    <HpBar member={member} />
    <dl className="facts">
      <div>
        <dt>Level</dt>
        <dd>{availableValue(member.level, String)}</dd>
      </div>
      <div>
        <dt>Ability</dt>
        <dd>{availableValue(member.ability, String)}</dd>
      </div>
      <div>
        <dt>Held item</dt>
        <dd>{availableValue(member.heldItem, String)}</dd>
      </div>
    </dl>
    <h4>Moves</h4>
    {availableValue(member.moves, (moves) => (
      <div className="move-chips">
        {moves.map((move) => (
          <span className="move-chip" key={move.id}>
            {move.name} · PP {availableValue(move.pp, String)}
          </span>
        ))}
      </div>
    ))}
    <details className="party-more">
      <summary>More details</summary>
      <dl className="facts">
        <div>
          <dt>Nature</dt>
          <dd>{availableValue(member.nature, String)}</dd>
        </div>
        <div>
          <dt>Experience</dt>
          <dd>{availableValue(member.experience, String)}</dd>
        </div>
        <div>
          <dt>Friendship</dt>
          <dd>{availableValue(member.friendship, String)}</dd>
        </div>
        <div>
          <dt>Gender</dt>
          <dd>{availableValue(member.gender, String)}</dd>
        </div>
        <div>
          <dt>Shiny</dt>
          <dd>{availableValue(member.shiny, String)}</dd>
        </div>
        <div>
          <dt>PokeRus</dt>
          <dd>{availableValue(member.pokerus, String)}</dd>
        </div>
      </dl>
      <h4>Stats</h4>
      <Values value={member.stats} />
      <h4>Stat stages</h4>
      <Values value={member.statStages} />
      <h4>IVs</h4>
      <Values value={member.ivs} />
      <h4>EVs</h4>
      <Values value={member.evs} />
    </details>
  </article>
);

const LegacyRunView = ({ snapshot }: { readonly snapshot: LegacyRunSnapshot }) => (
  <main>
    <header className="run-header">
      <p className="eyebrow">Run status</p>
      <h1>{snapshot.status}</h1>
    </header>
    <section>
      <h2>Current party</h2>
      <div className="party-grid">
        {snapshot.party.map((member) => (
          <article className="party-card" key={member.id}>
            <h3>{member.name}</h3>
            <TypeTags value={member.types} />
            <p>
              <strong>Moves:</strong>{" "}
              {availableValue(member.moves, (moves) => moves.join(", ") || "None")}
            </p>
            <h4>Stats</h4>
            <Values value={member.stats} />
            <h4>IVs</h4>
            <Values value={member.ivs} />
            <h4>EVs</h4>
            <Values value={member.evs} />
          </article>
        ))}
      </div>
    </section>
    <section>
      <h2>Current route</h2>
      {availableValue(snapshot.route, (route) => (
        <div className="route-card">
          <div className="route-top">
            <h3>{route.name}</h3>
            <span className="badge badge-live">
              {route.completed}/{route.total}
            </span>
          </div>
          <ProgressTrack
            steps={route.trainers.map((trainer) => ({
              name: trainer.name,
              state:
                trainer.battled.availability === "available" && trainer.battled.value
                  ? "battled"
                  : "upcoming",
            }))}
          />
          <div className="trainer-list">
            {route.trainers.map((trainer) => {
              const battled = trainer.battled.availability === "available" && trainer.battled.value;
              return (
                <div className="trainer-row" key={trainer.id}>
                  <span>{trainer.name}</span>
                  <span className={`badge ${battled ? "badge-success" : ""}`}>
                    {availableValue(trainer.battled, (value) =>
                      value ? "Battled" : "Not battled",
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </section>
  </main>
);

const Panel = ({
  title,
  open,
  onToggle,
  children,
}: {
  readonly title: string;
  readonly open: boolean;
  readonly onToggle: () => void;
  readonly children: ReactNode;
}) => (
  <section className="panel">
    <button
      type="button"
      className="panel-summary"
      aria-expanded={open}
      aria-controls={`panel-${title}`}
      onClick={onToggle}
    >
      {title}
    </button>
    {open && (
      <div className="panel-content" id={`panel-${title}`}>
        {children}
      </div>
    )}
  </section>
);

export const ExpandedRunView = ({ snapshot }: { readonly snapshot: ExpandedRunSnapshot }) => {
  const [openPanel, setOpenPanel] = useState<string | undefined>(undefined);
  const togglePanel = (title: string) => {
    setOpenPanel((current) => (current === title ? undefined : title));
  };

  const routeProgress = availableValue(
    snapshot.route,
    (route) => `${String(route.completed)}/${String(route.total)}`,
  );
  const activeBattle =
    snapshot.battle.availability === "available" && snapshot.battle.value.active
      ? snapshot.battle.value
      : undefined;

  return (
    <main className="dashboard">
      <header className="run-header">
        <p className="eyebrow">Live run</p>
        <h1>{snapshot.status}</h1>
      </header>
      <section aria-label="Run overview" className="overview-grid">
        <article className="overview-card">
          <h2>Location</h2>
          <p>{availableValue(snapshot.location, (location) => location.name)}</p>
          {availableValue(snapshot.route, (route) => (
            <ProgressTrack
              steps={route.trainers.map((trainer) => ({
                name: trainer.name,
                state:
                  trainer.battled.availability === "available" && trainer.battled.value
                    ? "battled"
                    : "upcoming",
              }))}
            />
          ))}
          <span className="badge-count">{routeProgress} trainers</span>
        </article>
        <article className="overview-card overview-card-party">
          <h2>Party</h2>
          <div className="overview-party">
            {snapshot.party.map((member) => (
              <div className="overview-party-row" key={member.id}>
                <Sprite member={member} />
                <div className="overview-party-info">
                  <span className="overview-party-name">{member.name}</span>
                  <HpBar member={member} />
                </div>
              </div>
            ))}
          </div>
        </article>
        <article className="overview-card">
          <h2>Battle</h2>
          <p>
            {activeBattle ? (
              `${activeBattle.kind} · ${activeBattle.format}`
            ) : snapshot.battle.availability === "available" ? (
              "No active battle"
            ) : (
              <Unavailable />
            )}
          </p>
        </article>
        <article className="overview-card">
          <h2>Badges</h2>
          {availableValue(snapshot.progress, (progress) => (
            <BadgeChips value={progress.badges} />
          ))}
        </article>
      </section>
      <section className="panel-stack" aria-label="Run details">
        <Panel
          title="Party"
          open={openPanel === "Party"}
          onToggle={() => {
            togglePanel("Party");
          }}
        >
          <div className="party-grid">
            {snapshot.party.map((member) => (
              <PartyDetails key={member.id} member={member} />
            ))}
          </div>
        </Panel>
        {activeBattle && (
          <Panel
            title="Battle"
            open={openPanel === "Battle"}
            onToggle={() => {
              togglePanel("Battle");
            }}
          >
            <h2>
              {activeBattle.kind} battle · {activeBattle.format}
            </h2>
            <p>Outcome: {availableValue(activeBattle.outcome, String)}</p>
            {availableValue(activeBattle.trainer, (trainer) => (
              <p className="trainer-heading">
                <TrainerPortrait trainer={trainer} />
                Opponent:{" "}
                {trainer.trainerClass.availability === "available"
                  ? `${trainer.trainerClass.value} `
                  : ""}
                {trainer.name}
              </p>
            ))}
            <h3>Active opponents</h3>
            <div className="party-grid">
              {activeBattle.opponents.map((member) => (
                <PartyDetails key={member.id} member={member} />
              ))}
            </div>
          </Panel>
        )}
        <Panel
          title="Route"
          open={openPanel === "Route"}
          onToggle={() => {
            togglePanel("Route");
          }}
        >
          {availableValue(snapshot.route, (route) => (
            <>
              <div className="route-top">
                <h2>{route.name}</h2>
                <span className="badge badge-live">
                  {route.completed}/{route.total}
                </span>
              </div>
              <ProgressTrack
                steps={route.trainers.map((trainer) => ({
                  name: trainer.name,
                  state:
                    trainer.battled.availability === "available" && trainer.battled.value
                      ? "battled"
                      : "upcoming",
                }))}
              />
              <div className="trainer-list">
                {route.trainers.map((trainer) => {
                  const battled =
                    trainer.battled.availability === "available" && trainer.battled.value;
                  return (
                    <div className="trainer-row" key={trainer.id}>
                      <span className="trainer-heading">
                        <TrainerPortrait trainer={trainer} />
                        {trainer.name}
                        {trainer.trainerClass.availability === "available"
                          ? ` · ${trainer.trainerClass.value}`
                          : ""}
                      </span>
                      <span className={`badge ${battled ? "badge-success" : ""}`}>
                        {availableValue(trainer.battled, (value) =>
                          value ? "Battled" : "Not battled",
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          ))}
        </Panel>
        <Panel
          title="Progress"
          open={openPanel === "Progress"}
          onToggle={() => {
            togglePanel("Progress");
          }}
        >
          {availableValue(snapshot.progress, (progress) => (
            <>
              <dl className="facts">
                <div>
                  <dt>ROM</dt>
                  <dd>{availableValue(progress.romName, String)}</dd>
                </div>
                <div>
                  <dt>Game code</dt>
                  <dd>{availableValue(progress.gameCode, String)}</dd>
                </div>
                <div>
                  <dt>Tracker</dt>
                  <dd>{availableValue(progress.trackerVersion, String)}</dd>
                </div>
                <div>
                  <dt>Timer</dt>
                  <dd>{availableValue(progress.timer, String)}</dd>
                </div>
                <div>
                  <dt>Paused</dt>
                  <dd>{availableValue(progress.paused, String)}</dd>
                </div>
                <div>
                  <dt>Playtime</dt>
                  <dd>{availableValue(progress.playtime, String)}</dd>
                </div>
              </dl>
              <h4>Badges</h4>
              <BadgeChips value={progress.badges} />
              <h4>Run counters</h4>
              <div className="counter-row">
                <span className="counter">
                  <span className="counter-label">Centre heals</span>
                  <span className="counter-value">
                    {availableValue(progress.centreHeals, String)}
                  </span>
                </span>
                <span className="counter">
                  <span className="counter-label">Wild battles</span>
                  <span className="counter-value">
                    {availableValue(progress.wildBattles, String)}
                  </span>
                </span>
                <span className="counter">
                  <span className="counter-label">Trainer battles</span>
                  <span className="counter-value">
                    {availableValue(progress.trainerBattles, String)}
                  </span>
                </span>
                <span className="counter">
                  <span className="counter-label">Fishing</span>
                  <span className="counter-value">{availableValue(progress.fishing, String)}</span>
                </span>
                <span className="counter">
                  <span className="counter-label">Rock Smash</span>
                  <span className="counter-value">
                    {availableValue(progress.rockSmash, String)}
                  </span>
                </span>
              </div>
            </>
          ))}
        </Panel>
      </section>
    </main>
  );
};

const RunView = ({ snapshot }: { readonly snapshot: RunSnapshot }) =>
  snapshot.schemaVersion === 1 ? (
    <LegacyRunView snapshot={snapshot} />
  ) : (
    <ExpandedRunView snapshot={snapshot} />
  );

const channelFromPath = () => /^\/channel\/(\d{5})$/.exec(window.location.pathname)?.[1];

const ActiveChannels = ({ onSelect }: { readonly onSelect: (channelCode: string) => void }) => {
  const [channels, setChannels] = useState<readonly string[] | "error">();

  useEffect(() => {
    let cancelled = false;
    fetchActiveChannels()
      .then((result) => {
        if (!cancelled) setChannels(result);
      })
      .catch(() => {
        if (!cancelled) setChannels("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (channels === undefined) return null;
  if (channels === "error") return null;

  return (
    <section className="active-channels">
      <h2>Active channels</h2>
      {channels.length === 0 ? (
        <p className="active-channels-empty">No channels are live right now.</p>
      ) : (
        <ul>
          {channels.map((channelCode) => (
            <li key={channelCode}>
              <a
                href={`/channel/${channelCode}`}
                onClick={(clickEvent) => {
                  if (
                    clickEvent.defaultPrevented ||
                    clickEvent.button !== 0 ||
                    clickEvent.metaKey ||
                    clickEvent.ctrlKey ||
                    clickEvent.shiftKey ||
                    clickEvent.altKey
                  ) {
                    return;
                  }
                  clickEvent.preventDefault();
                  onSelect(channelCode);
                }}
              >
                Channel {channelCode}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

export const App = () => {
  if (window.location.pathname === "/download") return <DownloadCompanion />;
  if (window.location.pathname === "/setup") return <SetupCompanion />;
  const [code, setCode] = useState(channelFromPath() ?? "");
  const [activeCode, setActiveCode] = useState(channelFromPath());
  const [event, setEvent] = useState<ChannelEvent>({ type: "inactive" });
  const [connected, setConnected] = useState(false);

  useEffect(
    () => (activeCode ? subscribeToChannel(activeCode, setEvent, setConnected) : undefined),
    [activeCode],
  );

  const openChannel = (channelCode: string) => {
    window.history.pushState({}, "", `/channel/${channelCode}`);
    setActiveCode(channelCode);
  };

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (!/^\d{5}$/.test(code)) return;
    openChannel(code);
  };

  if (!activeCode)
    return (
      <main className="entry">
        <p className="eyebrow">IronMON Live</p>
        <h1>Follow a live run</h1>
        <ActiveChannels onSelect={openChannel} />
        <form onSubmit={submit}>
          <label htmlFor="channel">Five-digit channel code</label>
          <input
            id="channel"
            inputMode="numeric"
            pattern="[0-9]{5}"
            maxLength={5}
            value={code}
            onChange={(change) => {
              setCode(change.target.value);
            }}
          />
          <button type="submit">Open channel</button>
        </form>
        <a className="companion-link" href="/download">
          Download the macOS companion
        </a>
      </main>
    );

  return (
    <>
      <TopBar channelCode={activeCode} connected={connected} />
      {!connected && (
        <div className="connection">Reconnecting to tracker — showing the last known state.</div>
      )}
      {event.type === "active" ? (
        <RunView snapshot={event.snapshot} />
      ) : (
        <main className="entry">
          <p className="eyebrow">Channel {activeCode}</p>
          <h1>No active run</h1>
        </main>
      )}
    </>
  );
};
