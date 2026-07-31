---
name: typescript-expert
description: Apply this repository's pragmatic TypeScript coding preferences when creating, modifying, reviewing, or refactoring .ts and .tsx files. Do not load for documentation-only, shell-only, or non-TypeScript changes.
---

# TypeScript expert

Inspect the local TypeScript, ESLint, Prettier, and neighboring-code conventions
before editing. Preserve strict types and validate with `npm run check`.

Prefer, without treating preferences as absolute rules:

- `type` aliases over `interface` declarations.
- Arrow functions over `function` declarations.
- Functional transformations over mutation-heavy loops.
- Inferred types when clear; explicit types at important boundaries.
- Small, composable functions and immutable data.

Choose the clearer or safer exception when interoperability, declaration
merging, control flow, performance, type inference, or readability favors it. A
straightforward loop is better than a contorted functional pipeline. A function
declaration is acceptable when hoisting or stack readability materially helps.
An interface is acceptable when declaration merging or an external contract
requires it.

Use Prettier for formatting and type-aware ESLint for mechanical safety. Do not
encode subjective preferences as hard lint errors when legitimate exceptions
are common.
