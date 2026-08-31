/* global console */
import { readFileSync } from "node:fs";
import * as d3 from "d3";

function readCsv(path) {
  return d3.csvParse(readFileSync(path, "utf8"));
}

function assert(condition, message) {
  if (!condition) throw new Error(`Data validation failed: ${message}`);
}

const summaries = readCsv("public/data/country_summary.csv");
const historical = readCsv("public/data/sea_level_historical.csv");
const stationCoverage = readCsv("public/data/historical_station_coverage.csv");
const seaLevel = readCsv("public/data/sea_level.csv");
const provenance = JSON.parse(readFileSync("public/data/provenance.json", "utf8"));

assert(summaries.length === 21, `expected 21 country summaries, found ${summaries.length}`);
assert(new Set(summaries.map((row) => row.country_code)).size === 21, "country codes must be unique");
assert(
  summaries.every((row) => Number.isFinite(+row.sea_level_rise_mm) && +row.sea_level_rise_mm > 0),
  "every country summary must contain a positive, finite sea-level change",
);
const changes = summaries.map((row) => +row.sea_level_rise_mm);
assert(d3.min(changes) === 80, "hero minimum must remain 80 mm");
assert(d3.median(changes) === 100, "hero median must remain 100 mm");
assert(d3.max(changes) === 180, "hero maximum must remain 180 mm");
assert(
  seaLevel.every((row) => +row.sea_level_mm % 100 === 0),
  "official annual values must remain consistent with the published 0.1 m increments",
);
for (const summary of summaries) {
  const observations = seaLevel.filter((row) => row.country_code === summary.country_code);
  const earlyObservations = observations.filter((row) => +row.year >= 1993 && +row.year <= 1997);
  const recentObservations = observations.filter((row) => +row.year >= 2019 && +row.year <= 2023);
  assert(
    earlyObservations.length === 5,
    `${summary.country} must have five observations in the early comparison period`,
  );
  assert(
    recentObservations.length === 5,
    `${summary.country} must have five observations in the recent comparison period`,
  );
  const early = d3.mean(earlyObservations, (row) => +row.sea_level_mm);
  const recent = d3.mean(recentObservations, (row) => +row.sea_level_mm);
  assert(+summary.sea_level_1993_1997_mm === early, `${summary.country} early mean must match source data`);
  assert(+summary.sea_level_2019_2023_mm === recent, `${summary.country} recent mean must match source data`);
  assert(+summary.sea_level_rise_mm === recent - early, `${summary.country} rise must equal period-mean difference`);
}

const years = historical.map((row) => +row.year);
assert(d3.min(years) === 1947, "historical coverage must begin in 1947");
assert(d3.max(years) === 2025, "raw historical coverage must end in 2025");
for (let year = 1947; year <= 2025; year += 1) {
  assert(years.includes(year), `historical data is missing year ${year}`);
}
const historicalCoverage = new Map();
for (const row of historical) {
  if (+row.year > 2023) continue;
  if (!historicalCoverage.has(+row.year)) historicalCoverage.set(+row.year, new Set());
  historicalCoverage.get(+row.year).add(row.country_code);
}
assert(
  Math.min(...Array.from(historicalCoverage.values(), (codes) => codes.size)) === 1 &&
    Math.max(...Array.from(historicalCoverage.values(), (codes) => codes.size)) === 12,
  "displayed historical coverage must range from 1 to 12 countries",
);
assert(provenance.generated_at_utc, "provenance must record generation time");
assert(provenance.candidate_station_count === 28, "provenance must record 28 candidate stations");
assert(provenance.candidate_station_ids.length === 28, "provenance must list 28 candidate station IDs");
assert(provenance.retained_station_count === 23, "provenance must record 23 retained stations");
assert(provenance.retained_station_ids.length === 23, "provenance must list 23 retained station IDs");
for (const row of historical) {
  const coverage = stationCoverage.find(
    (candidate) =>
      candidate.country_code === row.country_code && +candidate.year === +row.year,
  );
  assert(coverage, `station coverage must exist for ${row.country_code} in ${row.year}`);
  assert(
    coverage.station_ids.split(",").length === +row.station_count,
    `station coverage count must match ${row.country_code} in ${row.year}`,
  );
}

console.log("Data checks passed: 21 country summaries; 1947–2025 historical coverage; provenance recorded.");
