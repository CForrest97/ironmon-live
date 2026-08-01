import { useEffect, useState, type FormEvent } from "react";
import type { Available, ChannelEvent, RunSnapshot } from "@ironmon-live/contracts";
import { subscribeToChannel } from "./channel.ts";

const Unavailable = () => <span className="unavailable">Unavailable</span>;

const ListValue = ({ value }: { readonly value: Available<readonly string[]> }) =>
  value.availability === "available" ? (
    <span>{value.value.join(", ") || "None"}</span>
  ) : (
    <Unavailable />
  );

const NumberValues = ({
  value,
}: {
  readonly value: Available<Readonly<Record<string, number>>>;
}) =>
  value.availability === "available" ? (
    <dl className="values">
      {Object.entries(value.value).map(([label, amount]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{amount}</dd>
        </div>
      ))}
    </dl>
  ) : (
    <Unavailable />
  );

const RunView = ({ snapshot }: { readonly snapshot: RunSnapshot }) => (
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
            <p>
              <strong>Types:</strong> <ListValue value={member.types} />
            </p>
            <p>
              <strong>Moves:</strong> <ListValue value={member.moves} />
            </p>
            <h4>Stats</h4>
            <NumberValues value={member.stats} />
            <h4>IVs</h4>
            <NumberValues value={member.ivs} />
            <h4>EVs</h4>
            <NumberValues value={member.evs} />
          </article>
        ))}
      </div>
    </section>
    <section>
      <h2>Current route</h2>
      {snapshot.route.availability === "unavailable" ? (
        <Unavailable />
      ) : (
        <div className="route-card">
          <h3>{snapshot.route.value.name}</h3>
          <p>
            {snapshot.route.value.completed} of {snapshot.route.value.total} trainers battled
          </p>
          <ul>
            {snapshot.route.value.trainers.map((trainer) => (
              <li key={trainer.id}>
                {trainer.name}:{" "}
                {trainer.battled.availability === "available" ? (
                  trainer.battled.value ? (
                    "Battled"
                  ) : (
                    "Not battled"
                  )
                ) : (
                  <Unavailable />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  </main>
);

const channelFromPath = () => /^\/channel\/(\d{5})$/.exec(window.location.pathname)?.[1];

export const App = () => {
  const [code, setCode] = useState(channelFromPath() ?? "");
  const [activeCode, setActiveCode] = useState(channelFromPath());
  const [event, setEvent] = useState<ChannelEvent>({ type: "inactive" });
  const [connected, setConnected] = useState(false);

  useEffect(
    () => (activeCode ? subscribeToChannel(activeCode, setEvent, setConnected) : undefined),
    [activeCode],
  );

  const submit = (submitEvent: FormEvent) => {
    submitEvent.preventDefault();
    if (!/^\d{5}$/.test(code)) return;
    window.history.pushState({}, "", `/channel/${code}`);
    setActiveCode(code);
  };

  if (!activeCode)
    return (
      <main className="entry">
        <p className="eyebrow">IronMON Live</p>
        <h1>Follow a live run</h1>
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
      </main>
    );

  return (
    <>
      <div className={`connection ${connected ? "connected" : "reconnecting"}`}>
        Channel {activeCode} · {connected ? "Live" : "Reconnecting"}
      </div>
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
