# Repository Guidelines

## Project Structure & Module Organization

This is a Vite React + TypeScript data visualization project. Application code lives in `src/`: page composition in `App.tsx`, reusable UI in `src/components/`, hooks in `src/hooks/`, D3/data utilities in `src/lib/`, shared types in `src/types.ts`, and global styles in `src/styles.css`. Static CSVs and images are in `public/data/` and `public/image/`. Data preparation scripts are in `script/`. Production output is generated in `dist/` and should not be edited by hand.

## Build, Test, and Development Commands

Use Bun for local development:

```bash
bun install       # install dependencies
bun run dev       # start Vite dev server
bun run typecheck # run TypeScript project checks
bun run build     # typecheck and build production assets
bun run preview   # preview the production build locally
```

## Coding Style & Naming Conventions

Use TypeScript, React function components, and ES modules. Follow the existing style: two-space indentation, double quotes, semicolons, and explicit interfaces for component props. Name React components in PascalCase, hooks as `useSomething`, and utility functions in camelCase. Keep D3 rendering logic in `src/lib/` and React lifecycle/wiring in components or hooks. Prefer small, focused modules over large mixed-purpose files.

## Testing Guidelines

When changing UI or chart behavior, verify both desktop and mobile layouts manually in the browser. For scroll-driven chart changes, check that reduced-motion behavior remains usable and that text does not overlap or overflow. Always run:

```bash
bun run typecheck
bun run build
```

If tests are added later, place them near the code they cover and document the runner command here.

## Data & Assets

CSV files in `public/data/` are generated from `script/data.R`. Do not manually edit generated data unless the change is explicitly intentional and documented. Keep new visual assets under `public/image/` and reference them through Vite’s base-aware paths.
