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
- Follow [CONTRIBUTING.md](CONTRIBUTING.md) for the change process.
- Agents must also follow [AGENTS.md](AGENTS.md).

## Quality checks

Node is used only for repository tooling; it does not constrain the future
application stack.

```sh
npm ci
npm run check
```

Use `npm test` to run the document-contract fixture suite and
`npm run check:external` to check remote links on demand.

## Status

There is no production application yet. Product discovery and strategic domain
modeling are the current work.

## License

This project is licensed under the [MIT License](LICENSE).
