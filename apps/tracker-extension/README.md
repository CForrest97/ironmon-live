# IronMON Tracker extension

`IronMONLive.lua` exports the current Tracker state using version 1 of the
IronMON Live canonical schema.

## Install

Copy `IronMONLive.lua` into the IronMON Tracker extension directory and enable
it through the Tracker. Start the local companion before enabling the extension
so that the companion creates its configuration directory.

By default, both processes use `~/.ironmon-live/tracker.json` (or the equivalent
directory under `%USERPROFILE%` on Windows). If neither home-directory
environment variable is available, the extension writes `tracker.json` in the
Tracker's data directory; start the companion with `--input` pointing to that
file.

The extension writes through a temporary file and replaces the snapshot file.
It refreshes an unchanged message every two seconds so an active companion
continues to publish heartbeats.

From the repository root, run `npm run dev` to start the local web application,
Worker, and companion. The companion watches this extension's default output
path and publishes it to the local development server.

## Data availability

The extension exports only the party and current-route fields in the canonical
contract. Missing Tracker values use the contract's `unavailable` wrapper;
numeric zero and empty arrays are retained only when the Tracker reports those
values as available.
