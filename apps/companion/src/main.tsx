import { getCurrentWindow } from "@tauri-apps/api/window";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startRuntime } from "./desktop/runtime";
import type { CompanionState } from "./desktop/types";

const RuntimeRoot = ({
  runtime,
}: {
  readonly runtime: Awaited<ReturnType<typeof startRuntime>>;
}) => {
  const [state, setState] = useState<CompanionState>(runtime.getState());
  useEffect(() => runtime.subscribe(setState), []);
  return <App state={state} actions={runtime.actions} />;
};

const root = document.getElementById("root");
if (!root) throw new Error("Companion root element is missing.");
const reactRoot = createRoot(root);

const showStartupError = (error: unknown) => {
  const details = error instanceof Error ? error.message : String(error);
  reactRoot.render(
    <main>
      <header>
        <span className="indicator indicator-action_required" aria-hidden="true" />
        <div>
          <p className="eyebrow">IronMON Live</p>
          <h1>Action required</h1>
        </div>
      </header>
      <p>The companion could not start.</p>
      <section className="notice">
        <h2>Startup details</h2>
        <p>{details}</p>
      </section>
      <p className="muted">Quit IronMON Live, then reopen it after resolving the issue.</p>
    </main>,
  );
};

try {
  const runtime = await startRuntime();
  if (runtime.getState().disclosureAccepted) await getCurrentWindow().hide();
  await getCurrentWindow().onCloseRequested((event) => {
    event.preventDefault();
    void getCurrentWindow().hide();
  });
  reactRoot.render(
    <StrictMode>
      <RuntimeRoot runtime={runtime} />
    </StrictMode>,
  );
} catch (error) {
  showStartupError(error);
}
