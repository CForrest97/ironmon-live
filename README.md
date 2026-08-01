# IronMON Live

IronMON Live is currently in product discovery. This repository is deliberately
documentation-first: product intent, domain language, and durable decisions are
established before an application stack is selected.

## Start here

- Read the [product brief](docs/product/product-brief.md) and
  [product principles](docs/product/principles.md).
- Learn the domain through the [domain narrative](docs/domain/narrative.md),
  [glossary](docs/domain/glossary.md), and
  [context map](docs/domain/context-map.md).
- Browse [product specifications](docs/product/specs/README.md),
  [bounded contexts](docs/domain/contexts/README.md), and
  [decision records](docs/decisions/README.md).
- Select work from the [versioned work-item index](work/items/README.md).
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the change process.
- Agents must also follow [AGENTS.md](AGENTS.md).

## Quality checks

Repository tooling is written in TypeScript and runs on Node. TypeScript is the
preferred language for future code wherever the target platform supports it.

```sh
npm ci
npm run check
```

Use `npm test` to run the document-contract fixture suite and
`npm run check:external` to check remote links on demand.

## Application workspaces

- `packages/contracts` defines the versioned Tracker and channel contracts.
- `apps/companion` provides the TypeScript-owned Tauri menu-bar companion; its
  generated Rust bootstrap contains no product logic.
- `apps/tracker-extension` provides the Lua producer for IronMON Tracker.
- `apps/web` contains the React/Vite view and Cloudflare Worker.
- `infra` contains production OpenTofu configuration.

The application is an unvalidated MVP. PRD-001 remains draft while latency and
player-usability evidence are gathered.

## Companion development

Start the Tauri companion in development mode:

```sh
npm start
```

The companion watches `~/.ironmon-live/tracker.json`, publishes to IronMON
Live, and retains its generated channel code in
`~/.ironmon-live/config.json`. A Rust toolchain is required only to build the
generated Tauri host; application behavior is implemented in TypeScript.

## Local development

Start the web application, local Worker, and companion together:

```sh
npm run dev
```

This command retains the internal CLI as a lightweight local publication
harness alongside the web application. The development server is available at
`http://127.0.0.1:5174`. Override the
port with `IRONMON_LIVE_DEV_PORT` when needed. The companion uses
`.ironmon-live/dev-config.json`, keeping local development settings
separate from the normal companion configuration. The Lua extension continues
to write to its default `~/.ironmon-live/tracker.json` input path.

## License

This project is licensed under the [MIT License](LICENSE).
