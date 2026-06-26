# Pacific Dataviz Challenge (2026)

An interactive data story about sea-level change across 21 Pacific countries
and territories, focused on the regional tide-gauge record.

Built with React, TypeScript, D3.js, and Vite.

## Development

Requires [bun](https://bun.sh).

```bash
bun install
bun run dev        # start the dev server
bun run build      # typecheck + production build into dist/
bun run preview    # serve the production build locally
```

## Data and method

The CSVs in `public/data/` are produced by `script/data.R` from Pacific Data
Hub, PSMSL, and related sources. Run the R script to regenerate them.

The main chart uses `public/data/sea_level_historical.csv`, a tide-gauge
series with annual sea-level anomaly values in millimeters. Each station is
measured relative to its own 1993-2000 baseline, then observations are
aggregated by country and year. The final story uses the global/regional
aggregate prepared in the app from those annual country records.

The radial chart applies a centered five-year rolling average for display only.
This smoothing is meant to make the long-term direction readable in a circular
layout; it does not replace the underlying annual measurements. Coverage changes
through time, so an early year based on fewer stations or countries is not
directly equivalent to a later year with broader coverage.

The three headline figures come from `public/data/country_summary.csv`:

- average 1993-2023 sea-level change across the 21 countries and territories;
- cumulative people directly affected by recorded disasters, 2005-2023;
- cumulative reported disaster losses, 2007-2020.

The disaster metrics include all recorded disasters in the source data, not only
coastal or sea-level events. They provide regional risk context rather than a
direct attribution to sea-level rise.

`public/data/sea_level.csv` contains the satellite-era record. Earlier versions
of the project compared satellite and tide-gauge views; the final story removes
that choice and focuses on one global tide-gauge narrative.
