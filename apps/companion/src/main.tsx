import { getCurrentWindow } from "@tauri-apps/api/window";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { startRuntime } from "./desktop/runtime";
import type { CompanionState } from "./desktop/types";

const runtime = await startRuntime();
if (runtime.getState().disclosureAccepted) await getCurrentWindow().hide();

const Root = () => {
  const [state, setState] = useState<CompanionState>(runtime.getState());
  useEffect(() => runtime.subscribe(setState), []);
  return <App state={state} actions={runtime.actions} />;
};

await getCurrentWindow().onCloseRequested((event) => {
  event.preventDefault();
  void getCurrentWindow().hide();
});

const root = document.getElementById("root");
if (!root) throw new Error("Companion root element is missing.");
createRoot(root).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
