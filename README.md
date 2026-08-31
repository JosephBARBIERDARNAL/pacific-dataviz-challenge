# Pacific Dataviz Challenge (2026)

An interactive data story about a widespread sea-level signal and the uneven
historical measurement record across the Pacific.

The official Pacific Data Hub comparison is the analytical backbone: across 21
countries and territories, the 2019–2023 sea-level anomaly is 8–18 cm higher
than the 1993–1997 period mean. A selected PSMSL tide-gauge record then provides
longer historical context while making its changing country and station coverage
visible.

Built with React, TypeScript, D3.js, and Vite.

## Data sources

The generated CSVs are prepared by [`script/data.R`](script/data.R) and are not
edited manually.

- Official challenge data: [Pacific Data Hub sea-level anomalies](https://stats-nsi-stable.pacificdata.org/rest/data/SPC,DF_CLIMATE_CHANGE,1.0/A.SEA_LVL./all?dimensionAtObservation=AllDimensions&detail=full&format=csvfile)
- Historical context: [Permanent Service for Mean Sea Level Revised Local Reference annual data](https://psmsl.org/data/obtaining/)
- [Pacific Data Hub terms of use](https://pacificdata.org/terms-use)
- [PSMSL referencing guidance](https://psmsl.org/data/obtaining/reference.php)

Pacific Data Hub data was accessed on 31 August 2026. The PSMSL archive is the 24 August 2026 database extract and is cited as: Permanent Service for Mean Sea Level (PSMSL), 2026, “Tide Gauge Data”; and Holgate et al. (2013), “New Data Systems and Products at the Permanent Service for Mean Sea Level,” _Journal of Coastal Research_ 29(3), 493–504, [doi:10.2112/JCOASTRES-D-12-00175.1](https://doi.org/10.2112/JCOASTRES-D-12-00175.1). The deployed story and footer link to the same source material.

## Official 21-country comparison

The country chart uses `public/data/country_summary.csv`.

1. Pacific Data Hub annual sea-level anomaly values, published in 0.1 m
   increments, are converted for calculation and displayed in centimetres.
2. A mean is calculated for 1993–1997 and for 2019–2023 for each country or
   territory.
3. The chart shows the recent period mean minus the early period mean.
4. All 21 resulting changes are positive: 8–18 cm, with a median of 10 cm.

The comparison is shown from a zero baseline and ordered by value. It is the
primary evidence for the story's claim that the recent increase is widespread.

## Historical tide-gauge method

The spiral uses `public/data/sea_level_historical.csv`. The preparation starts with a curated, non-exhaustive list of 28 PSMSL stations representing 12 countries and territories. The list is not a statistical sample of the Pacific; it is retained in `script/data.R` so the selection is explicit and reproducible.

1. Missing PSMSL values (`-99999`) are excluded.
2. A station is retained only when it has at least two observations during 1993–2000. Its anomaly is the annual value minus that station's mean during the available 1993–2000 baseline period.
3. Multiple stations for the same country and year are averaged into one country-year value.
4. The app calculates an unweighted mean of the available country-year values for each year. It is not population-, coastline-, or station-weighted.
5. A centered five-year mean is used for the spiral. The center readout also gives the annual mean and the contributing country and station count.

The raw generated file covers 1947–2025. The displayed story ends in 2023 because coverage falls to seven countries in 2024 and two in 2025. Coverage in the displayed period still varies from 1–12 countries and 1–19 stations, so the spiral is explicitly presented as historical context rather than a fixed regional index. The coverage strip and accessible annual table expose that limitation directly.

The radial encoding is:

- angle and baseline radius advance through time;
- the dashed spiral is the zero-anomaly reference;
- the colored line's radial offset is the centered five-year mean anomaly;
- the offset uses a symmetric linear millimetre scale;
- a 100 mm scale key is drawn inside the chart.

## Disaster data and missing values

The generation script still preserves the official affected-person and economic loss extracts for reproducibility. They are not combined with the sea-level visualization because the records cover different periods and disaster types and do not establish causality.

Missing country-level reports remain missing. In particular, absence of a loss record is not converted into a reported zero. `bun run check:data` enforces this invariant.
