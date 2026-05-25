# Satisfactory Dependency Visualizer

An interactive web app for exploring resource and production dependencies in
[Satisfactory](https://www.satisfactorygame.com/). Pick a target item and a
target rate (items/min); the app builds a recipe-dependency graph and tells
you how many machines, how much power, and which raw resources you need.

## Features

- **Recipe dependency graph** — every recipe shows up as a node, edges carry
  the item name and items/min flowing between them.
- **Production rate calculator** — fractional machine counts, per-recipe power,
  total raw-resource demand.
- **Per-item recipe override** — click "Swap recipe" on any node to compare
  alternates. The graph re-solves immediately.
- **Pin as raw input** — click "Stop here" to treat any intermediate item as
  a black-box raw input (useful when you already have a feed coming in).
- **Alternate-recipe default toggle** — opt into the unlocked alternates
  being preferred when picking defaults.
- **Cycle detection** — if alternates introduce a production loop (e.g. plastic
  ↔ rubber), the solver cuts the cycle and flags the cut.

## Data

Pulled from [greeny/SatisfactoryTools](https://github.com/greeny/SatisfactoryTools)
(`data/data.json`) and vendored to `public/data.json`. Refresh by replacing that
file when the game updates.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build to dist/
npm run typecheck
```

## Architecture

- `src/data/loader.ts` — fetches `/data.json` and builds lookups
  (`producersByItem`, `rawItems`, etc.).
- `src/solver/solver.ts` — recursive demand walker. Per call:
  - resolves each item to a chosen recipe (or treats as raw),
  - accumulates fractional machine counts,
  - sums power and raw-resource demand,
  - breaks cycles by treating the second visit as raw.
- `src/components/` — React Flow graph, custom nodes, sidebar controls,
  recipe-picker modal, summary panel.
- `src/components/layout.ts` — depth-based column layout (raw at depth 0,
  recipes at `1 + max(input depth)`).

## Known limitations

- No overclocking / underclocking model.
- Byproducts don't satisfy other demand — a recipe producing both X and Y
  scaled for X will over-produce Y (shown on the node) but the surplus isn't
  consumed elsewhere.
- Power consumption is the building's nominal value × machine count; variable-
  power buildings (e.g. Particle Accelerator) use their max.
- No persisted state — refresh resets recipe choices.
