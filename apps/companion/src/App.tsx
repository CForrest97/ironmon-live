import type { CompanionState } from "./desktop/types";
import "./styles.css";

export type CompanionActions = {
  readonly acceptDisclosure: () => Promise<void>;
  readonly chooseTrackerFolder: () => Promise<void>;
  readonly setPaused: (paused: boolean) => Promise<void>;
  readonly setStartAtLogin: (enabled: boolean) => Promise<void>;
  readonly openLiveView: () => Promise<void>;
  readonly copyChannelCode: () => Promise<void>;
  readonly checkForUpdates: () => Promise<void>;
  readonly resetChannelCode: () => Promise<void>;
};

export const App = ({ state, actions }: { state: CompanionState; actions: CompanionActions }) => (
  <main>
    <header>
      <span className={`indicator indicator-${state.status}`} aria-hidden="true" />
      <div>
        <p className="eyebrow">IronMON Live</p>
        <h1>{state.status.replaceAll("_", " ")}</h1>
      </div>
    </header>
    <p>
      {state.explanation}
      {state.retryAttempt !== undefined && ` (retry ${String(state.retryAttempt)})`}
    </p>
    {!state.disclosureAccepted && (
      <section className="notice">
        <h2>Before publishing</h2>
        <p>
          Valid Tracker state publishes automatically. Your five-digit channel can be viewed or
          published to by anyone who knows it; it is not a password.
        </p>
        <button onClick={() => void actions.acceptDisclosure()}>I understand</button>
      </section>
    )}
    <section>
      <h2>Live channel</h2>
      <div className="channel-row">
        <code>{state.channelCode}</code>
        <button className="secondary" onClick={() => void actions.copyChannelCode()}>
          Copy
        </button>
        <button className="secondary" onClick={() => void actions.openLiveView()}>
          Open
        </button>
      </div>
    </section>
    <section>
      <h2>Tracker setup</h2>
      <p className="muted">
        {state.trackerExtensionDirectory ?? "Choose your IronMON Tracker extension folder."}
      </p>
      <button className="secondary" onClick={() => void actions.chooseTrackerFolder()}>
        Choose Tracker Extension Folder…
      </button>
    </section>
    <section className="preferences">
      <h2>Preferences</h2>
      <label>
        <input
          type="checkbox"
          checked={!state.paused}
          onChange={(event) => void actions.setPaused(!event.currentTarget.checked)}
        />
        Publish automatically
      </label>
      <label>
        <input
          type="checkbox"
          checked={state.startAtLogin}
          onChange={(event) => void actions.setStartAtLogin(event.currentTarget.checked)}
        />
        Start at login
      </label>
    </section>
    <footer>
      <button className="link" onClick={() => void actions.checkForUpdates()}>
        Check for updates
      </button>
      <button className="link danger" onClick={() => void actions.resetChannelCode()}>
        Reset channel code
      </button>
      <span>v{state.appVersion}</span>
    </footer>
  </main>
);
