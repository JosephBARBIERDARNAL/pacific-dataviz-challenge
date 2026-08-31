# Pacific Dataviz Challenge (2026)

An interactive data story about a widespread sea-level signal and the uneven
historical measurement record across the Pacific.

Across the 21 countries and territories in the official Pacific Data Hub
dataset, the 2019–2023 sea-level anomaly is 8–18 cm higher than the 1993–1997
period mean. A selected PSMSL tide-gauge record supplies longer historical
context while exposing its changing country and station coverage.

Built with React, TypeScript, D3.js, and Vite.

## Data sources and provenance

Generated files are prepared by [`script/data.R`](script/data.R), never edited
manually. The committed [provenance record](public/data/provenance.json) records
the generation time, source endpoints, and complete selected station list.

- Official challenge data: [Pacific Data Hub sea-level anomalies](https://stats-nsi-stable.pacificdata.org/rest/data/SPC,DF_CLIMATE_CHANGE,1.0/A.SEA_LVL./all?dimensionAtObservation=AllDimensions&detail=full&format=csvfile)
- Historical context: [Permanent Service for Mean Sea Level (PSMSL) Revised Local Reference annual data](https://psmsl.org/data/obtaining/)
- [Pacific Data Hub terms of use](https://pacificdata.org/terms-use)
- [PSMSL referencing guidance](https://psmsl.org/data/obtaining/reference.php)

The exact generation timestamp for the current release is recorded in the
provenance file. Cite the historical source as: Permanent Service for Mean Sea
Level (PSMSL), 2026, “Tide Gauge Data”; and Holgate et al. (2013), “New Data
Systems and Products at the Permanent Service for Mean Sea Level,” *Journal of
Coastal Research* 29(3), 493–504,
[doi:10.2112/JCOASTRES-D-12-00175.1](https://doi.org/10.2112/JCOASTRES-D-12-00175.1).

## Official 21-country comparison

The country chart uses `public/data/country_summary.csv`.

1. Pacific Data Hub annual sea-level anomaly values, published in 0.1 m
   increments, are converted for calculation and shown in centimetres.
2. A mean is calculated for 1993–1997 and for 2019–2023 for every country or
   territory.
3. The chart shows the recent period mean minus the early period mean.
4. All 21 changes are positive: 8–18 cm, with a median of 10 cm.

The chart uses a zero baseline, direct country labels, and descending value
order. It is the primary evidence for the story’s claim that the recent increase
is widespread.

## Historical tide-gauge method

The spiral uses `public/data/sea_level_historical.csv`; its companion,
`public/data/historical_station_coverage.csv`, identifies the countries and
station IDs contributing in every year. The 28 candidate PSMSL stations represent
12 countries and territories; 23 pass the baseline rule and are retained. They
are curated and non-exhaustive—not a statistical sample of the Pacific.

1. Missing PSMSL values (`-99999`) are excluded.
2. A station is retained only with at least two observations in 1993–2000. Its
   anomaly is its annual value minus its available 1993–2000 mean.
3. Multiple stations are averaged within each country-year.
4. The app averages available country-year values without country, coastline, or
   station weighting.
5. The displayed line uses an up-to-five-year centered mean. The first two and
   final two years use shorter available windows.

The displayed file covers 1947–2025. Coverage varies from 1–12 countries and
1–19 stations, so the spiral is historical context, not a fixed Pacific-wide
index.

The radial encoding is disclosed in the app: time advances through angle and
baseline radius; the dashed spiral is zero anomaly; the colored line’s offset is
the smoothed anomaly on a symmetric linear millimetre scale. A conventional
timeline reproduces the same values for easier reading.

## Development and validation

Requires Bun. R is needed only to regenerate data.

```bash
bun install
bun run dev
bun run check:data
bun run typecheck
bun run lint
bun run build
bun run validate
Rscript script/data.R
```

`bun run validate` checks data invariants, type safety, linting, and production
build output. Before publishing UI changes, manually check 320, 375, 768, and
1440 px widths; mobile landscape; 200% zoom; keyboard-only navigation;
reduced-motion mode; data-table usability; and the full chart scroll.
