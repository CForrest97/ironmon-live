# MVP application stack

The initial application uses TypeScript throughout the repository-controlled
runtime: a Node CLI local companion, shared runtime contracts, a React/Vite
single-page application, and a Cloudflare Worker with Durable Objects.

The Lua Tracker extension writes a canonical snapshot through an atomically
replaced JSON file, and the local companion watches that file. The web
application uses plain CSS and viewer WebSockets. Vitest provides focused
contract, service, runtime, and component-level validation.

Cloudflare's Vite plugin and Wrangler build and deploy the Worker, static
assets, Durable Object bindings, and class migrations. OpenTofu manages the
production custom domain and future infrastructure that can be provisioned
independently of application code. Its production state is stored in a private,
manually bootstrapped R2 bucket. No resource may be managed by both tools.

This selection implements [PRD-001](../product/specs/PRD-001-live-player-companion.md)
and is recorded with delivery context in
[WORK-004](../../work/items/WORK-004-live-player-companion-mvp.md) and
[WORK-005](../../work/items/WORK-005-add-lua-tracker-extension.md).
