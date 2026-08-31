# Pacific Dataviz Challenge (2026)

An interactive data story about sea-level change across the Pacific. The
radial chart focuses on a selected Pacific tide-gauge record; the headline
figures provide country-level and disaster-risk context for 21 Pacific
countries and territories.

Built with React, TypeScript, D3.js, and Vite.

## Development

Requires [Bun](https://bun.sh), Node-compatible tooling, and R for regenerating
the data files.

```bash
bun install
bun run dev        # start the Vite dev server
bun run typecheck  # run TypeScript project checks
bun run lint       # run ESLint with zero warnings allowed
bun run build      # typecheck and build production assets into dist/
bun run validate   # run typecheck, lint, and build together
bun run preview    # preview the production build locally
```

## Data sources

The generated CSVs are prepared by [`script/data.R`](script/data.R) and are
not edited manually. The script retrieves:

- country-level indicators from the
  [Pacific Data Hub SDMX data service](https://stats-nsi-stable.pacificdata.org/rest/data);
- annual tide-gauge records from the
  [Permanent Service for Mean Sea Level Revised Local Reference archive](https://psmsl.org/data/obtaining/rlr.annual.data/rlr_annual.zip).

The historical tide-gauge series uses the following PSMSL station IDs:

`539, 540, 528, 1370, 1925, 513, 1217, 1838, 1254, 1303, 1607, 1608,
1609, 1610, 1860, 1739, 1804, 1452, 1839, 1373, 1861, 1841, 1327, 1805,
2356, 1397, 2242, 1843`.

## Historical tide-gauge method

The radial chart uses `public/data/sea_level_historical.csv`.

1. Each selected station is read from the PSMSL annual archive. Missing PSMSL
   values (`-99999`) are excluded.
2. A station is retained only when it has at least two observations during
   1993–2000. Its station anomaly is the annual value minus that station's
   mean during the available 1993–2000 baseline period.
3. When more than one selected station represents a country in a year, the
   station anomalies are averaged to create one country-year value.
4. The app averages the available country-year values for each year. This is
   an unweighted mean of available countries, not a population-weighted,
   coastline-weighted, or station-count-weighted regional estimate.
5. The app also carries the number of countries and stations contributing to
   each year. These counts are shown in the chart readout because coverage is
   not constant.

The historical file covers 1947–2025, but it does not represent all 21
countries in every year. Coverage ranges from 1–12 countries and 1–19 stations
per year. The 2025 endpoint contains only two countries, so it must not be
interpreted as equally comparable to years with broader coverage.

The radial encoding is deliberately disclosed in the chart itself:

- angle and baseline radius advance through time from 1947 to 2025;
- the dashed spiral is the zero-anomaly reference for that time position;
- the colored line's radial offset from the dashed spiral is the anomaly in
  millimeters;
- the offset is linearly scaled across the observed anomaly range;
- the line uses a centered five-year rolling mean for display, with a clipped
  window at the beginning and end of the record.

The rolling mean changes only the displayed line and readout. The generated
annual observations remain available in the CSV and are not replaced by the
smoothing operation.

## Headline metrics

The three sticky headline figures come from
`public/data/country_summary.csv`, which contains country-level context for 21
Pacific countries and territories:

- typical country sea-level change: median of country changes between the
  1993–1997 and 2019–2023 period means;
- people recorded as affected by disasters: cumulative 2005–2023 totals;
- reported disaster losses: cumulative 2007–2020 totals in USD.

The satellite-era sea-level metric is separate from the tide-gauge series in
the radial chart. The disaster metrics include all recorded disaster types,
not only coastal or sea-level events, and are contextual indicators rather
than evidence that sea-level rise directly caused those impacts.

`public/data/sea_level.csv` contains the satellite-era record used by the
country summary preparation. The final story does not offer a satellite versus
tide-gauge chart choice; it uses the tide-gauge record as its main visual.

## Known limitations

- The radial record is based on selected tide gauges, not a complete spatial
  sample of the Pacific.
- Station baselines are local and may differ from one another in measurement
  history and physical setting.
- Changing country and station coverage can change the composition of the
  yearly regional mean.
- The five-year smoothing improves readability in the radial layout but can
  hide short-term variability.
- Disaster totals are not attributed to sea-level rise.

## Validation

Before submission, run:

```bash
bun run validate
```

For UI changes, also check desktop, tablet, and mobile layouts; scroll from the
first through the final chart year; verify that the marker, readout, and
coverage counts agree; test `prefers-reduced-motion`; and confirm that labels
do not clip or create horizontal overflow.
