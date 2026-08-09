# Visual review harness

`npm run review:visual` captures the scenes below with Playwright and hands
them to `claude -p` for a rated review against
[`.agents/skills/visual-review/SKILL.md`](../../../.agents/skills/visual-review/SKILL.md).
`npm run capture:visual` runs only the capture, if you just want the
screenshots and geometry manifest.

## Customising fixture data

Edit [`fixtures.json`](./fixtures.json) — it's the single source of the raw
data (party members, trainers, route, progress counters). `capturedRunEvent`
is a real Tracker snapshot, not invented data; prefer swapping in another real
capture over hand-editing individual fields. `testFixtureEvent` is a separate,
deliberately minimal fixture the Playwright viewport specs assert exact
strings against ("Route 1", a "Tackle" move) — leave it alone unless you're
also updating those assertions.

`scenes.ts` only composes and validates `fixtures.json` (via
`parseChannelEvent`/`parseActiveChannels` from `@ironmon-live/contracts`, the
same parser the app runs on real traffic) — it no longer holds any literal
party or trainer data. Add a new `Scene` to the `scenes` array at the bottom
of `scenes.ts` to review a state that isn't covered yet.

Keep fixtures plausible for the point in a run they claim to represent. The
content-fit lens in the rubric judges whether the right information is on
screen, so a generic or sparse fixture (every party member healthy, no status
effects, one Tackle each) understates real findings.

## Choosing the model and effort

```bash
npm run review:visual -- --model=sonnet --effort=high
```

Both flags are forwarded straight to `claude -p`. Omit either to use your
current `claude` session defaults. Model aliases and effort levels
(`low`/`medium`/`high`/`xhigh`/`max`) are whatever your `claude` CLI accepts —
run `claude --help` to see the current list.

## Viewports and speed

Only the `desktop` viewport (1440x900) runs by default. Add `narrow` or `all`
to also cover the 640px width:

```bash
npm run review:visual -- --viewport=all
```

Scene/viewport pairs capture concurrently (4 at a time) rather than one at a
time. To cut a run down further, scope it to the scene(s) you're actually
checking:

```bash
npm run review:visual -- --scene=channel-mid-run
```

Run `node visual/capture.ts` with no arguments to see the default scope, or
read [`scenes.ts`](./scenes.ts) for the full list of scene names.
