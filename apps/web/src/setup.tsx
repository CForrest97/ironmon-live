import { TopBar } from "./TopBar.tsx";

export const SetupCompanion = () => (
  <>
    <TopBar />
    <main className="setup">
      <header>
        <p className="eyebrow">Companion setup</p>
        <h1>Bring your Tracker run live.</h1>
        <p className="lede">
          Set up the companion once, then it will publish fresh Tracker state whenever your run is
          ready.
        </p>
      </header>
      <ol className="setup-steps">
        <li>
          <section className="setup-step">
            <span className="setup-number" aria-hidden="true">
              1
            </span>
            <div>
              <h2>Install and open the companion</h2>
              <p>
                Download the macOS companion, move it to Applications, and open it. If macOS blocks
                the first launch, approve it in Privacy &amp; Security.
              </p>
              <a href="/download">Download the companion</a>
            </div>
          </section>
        </li>
        <li>
          <section className="setup-step">
            <span className="setup-number" aria-hidden="true">
              2
            </span>
            <div>
              <h2>Use the companion from the menu bar</h2>
              <p>
                After its first launch, the companion lives in the macOS menu bar, near the clock.
                Click its IronMON Live icon to see the current status, open Settings, open your live
                view, or copy your channel code. Closing Settings only hides the window; choose
                <strong> Quit IronMON Live</strong> from this menu only when you want publishing to
                stop.
              </p>
            </div>
          </section>
        </li>
        <li>
          <section className="setup-step">
            <span className="setup-number" aria-hidden="true">
              3
            </span>
            <div>
              <h2>Install the bundled Tracker extension</h2>
              <p>
                In the companion, choose <strong>Choose Tracker Extension Folder</strong> and select
                the folder where IronMON Tracker keeps its extensions. The companion installs{" "}
                <code>IronMONLive.lua</code> there. If a different copy already exists, it asks
                before backing it up and replacing it.
              </p>
            </div>
          </section>
        </li>
        <li>
          <section className="setup-step">
            <span className="setup-number" aria-hidden="true">
              4
            </span>
            <div>
              <h2>Enable IronMON Live in Tracker</h2>
              <p>
                Copying the file is not enough: Tracker must discover it and turn it on. In Tracker,
                click the gear icon, open <strong>Extensions</strong>, choose the
                <strong> General</strong> tab, and select <strong>Install a new extension</strong>.
                Then open the <strong>Extensions</strong> tab, select <strong>IronMON Live</strong>,
                and turn it on. Keep the companion open while you do this.
              </p>
              <details className="advanced-help">
                <summary>Using mGBA or cannot find the extension controls?</summary>
                <p>
                  This is an optional troubleshooting path, not a step most players need. In the
                  mGBA scripting console, enter <code>INSTALLEXT()</code> to make Tracker find the
                  copied file. The Extensions screen then shows a number beside IronMON Live. Enter
                  <code> OPTION &quot;XX&quot;</code>, replacing <code>XX</code> with that displayed
                  number, to turn it on. For example, if Tracker displays 52, enter
                  <code> OPTION &quot;52&quot;</code>. The number can differ between installations.
                </p>
              </details>
              <p className="tracker-help-link">
                If your Tracker uses different labels, see the{" "}
                <a href="https://github.com/besteon/Ironmon-Tracker/wiki/Tracker-Add-ons">
                  Tracker extension guide
                </a>
                .
              </p>
            </div>
          </section>
        </li>
        <li>
          <section className="setup-step">
            <span className="setup-number" aria-hidden="true">
              5
            </span>
            <div>
              <h2>Start your run</h2>
              <p>
                The companion first shows <strong>Waiting for Tracker</strong>. When it receives
                fresh, valid state, it starts publishing automatically. It changes to
                <strong> Live</strong> only after the latest state is accepted remotely. Use its
                menu to open your live view or copy the channel code when you want to share it.
              </p>
            </div>
          </section>
        </li>
      </ol>
      <aside className="setup-note">
        <h2>Sharing reminder</h2>
        <p>
          A channel code identifies your live channel; it is not a password or a privacy control.
          Share it only with people you want to follow your run.
        </p>
      </aside>
    </main>
  </>
);
