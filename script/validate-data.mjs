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
const losses = readCsv("public/data/disaster_losses.csv");
const seaLevel = readCsv("public/data/sea_level.csv");

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
  assert(
    observations.filter((row) => +row.year >= 1993 && +row.year <= 1997).length === 5,
    `${summary.country} must have five observations in the early comparison period`,
  );
  assert(
    observations.filter((row) => +row.year >= 2019 && +row.year <= 2023).length === 5,
    `${summary.country} must have five observations in the recent comparison period`,
  );
}

const years = historical.map((row) => +row.year);
assert(d3.min(years) === 1947, "historical coverage must begin in 1947");
assert(d3.max(years) === 2025, "raw historical coverage must end in 2025");
for (let year = 1947; year <= 2025; year += 1) {
  assert(years.includes(year), `historical data is missing year ${year}`);
}

const lossCodes = new Set(losses.map((row) => row.country_code));
const missingLossRows = summaries.filter((row) => !lossCodes.has(row.country_code));
assert(lossCodes.size === 12, `expected 12 countries with reported loss rows, found ${lossCodes.size}`);
assert(
  missingLossRows.every((row) => row.loss_usd_2007_2020 === ""),
  "countries without reported loss rows must remain missing rather than zero",
);

console.log("Data checks passed: 21 country summaries; 1947–2025 historical coverage; missing losses preserved.");
