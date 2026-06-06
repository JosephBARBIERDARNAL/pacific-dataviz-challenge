# Pacific Dataviz Challenge (2026)

An interactive view of satellite and tide-gauge sea-level change across 21 Pacific countries and territories.

Built with React, TypeScript, D3.js, and Vite.

## Development

Requires [bun](https://bun.sh).

```bash
bun install
bun run dev        # start the dev server
bun run build      # typecheck + production build into dist/
bun run preview    # serve the production build locally
```

## Data

The CSVs in `public/data/` are produced by `script/data.R` from Pacific Data
Hub, PSMSL, and related sources. Run the R script to regenerate them.
