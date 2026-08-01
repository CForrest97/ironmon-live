# MVP application stack

The initial application uses TypeScript throughout the repository-controlled
product runtime: a Tauri 2 macOS menu-bar companion with React/Vite, shared
runtime contracts, a separate React/Vite website, and a Cloudflare Worker with
Durable Objects. Tauri's generated Rust bootstrap exists only to initialize
official plugins; it contains no custom product logic or commands.

The Lua Tracker extension writes a canonical snapshot through an atomically
replaced JSON file, and the TypeScript companion watches that file through the
Tauri filesystem plugin. All browser-facing routes and download presentation
remain in `apps/web`; companion-local preferences and lifecycle types remain in
`apps/companion`. Vitest provides focused unit and component validation. V1
does not require automated companion integration or end-to-end tests.

Cloudflare's Vite plugin and Wrangler build and deploy the Worker, static
assets, Durable Object bindings, and class migrations. OpenTofu manages the
production custom domain, the companion-release R2 bucket and its download
domain, and other infrastructure that can be provisioned
independently of application code. Its production state is stored in a private,
manually bootstrapped R2 bucket. No resource may be managed by both tools.

This selection implements [PRD-001](../product/specs/PRD-001-live-player-companion.md)
and is recorded with delivery context in
[WORK-004](../../work/items/WORK-004-live-player-companion-mvp.md) and
[WORK-005](../../work/items/WORK-005-add-lua-tracker-extension.md), with the
desktop delivery recorded in
[WORK-008](../../work/items/WORK-008-ship-tauri-companion.md).
