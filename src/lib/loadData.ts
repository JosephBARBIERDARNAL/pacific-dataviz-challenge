import * as d3 from "d3";
import { DATA_PATHS } from "../constants";
import type {
  CountrySummary,
  HistoricalPoint,
  SatellitePoint,
  SeaLevelData,
} from "../types";

function parseSatellite(row: d3.DSVRowString): SatellitePoint {
  return {
    code: row.country_code!,
    country: row.country!,
    year: +row.year!,
    value: +row.sea_level_mm!,
  };
}

function parseHistorical(row: d3.DSVRowString): HistoricalPoint {
  return {
    code: row.country_code!,
    country: row.country!,
    year: +row.year!,
    value: +row.sea_level_anomaly_mm!,
    stationCount: +row.station_count!,
  };
}

function parseSummary(row: d3.DSVRowString): CountrySummary {
  return {
    code: row.country_code!,
    country: row.country!,
    earlyMean: +row.sea_level_1993_1997_mm!,
    recentMean: +row.sea_level_2019_2023_mm!,
    rise: +row.sea_level_rise_mm!,
    affected: +row.affected_people_2005_2023!,
    losses: +row.loss_usd_2007_2020!,
    populationGrowth: +row.population_growth_2020_2025_pct!,
  };
}

export async function loadSeaLevelData(): Promise<SeaLevelData> {
  const [satellite, historical, summaries] = await Promise.all([
    d3.csv(DATA_PATHS.satellite, parseSatellite),
    d3.csv(DATA_PATHS.historical, parseHistorical),
    d3.csv(DATA_PATHS.summary, parseSummary),
  ]);

  return prepareData(satellite, historical, summaries);
}

function prepareData(
  satellite: SatellitePoint[],
  historical: HistoricalPoint[],
  summaries: CountrySummary[],
): SeaLevelData {
  const satelliteByCountry = d3.group(satellite, (d) => d.code);
  const historicalByCountry = d3.group(historical, (d) => d.code);
  const summaryByCountry = new Map(summaries.map((d) => [d.code, d]));
  const countries = summaries
    .map(({ code, country }) => ({ code, country }))
    .sort((a, b) => d3.ascending(a.country, b.country));

  const satelliteYears = d3.sort(new Set(satellite.map((d) => d.year)));
  const regionalSatellite = satelliteYears.map((year) => {
    const values = satellite.filter((d) => d.year === year).map((d) => d.value);
    return {
      year,
      value: d3.mean(values)!,
      low: d3.min(values)!,
      high: d3.max(values)!,
      count: values.length,
    };
  });

  const historicalYears = d3.range(
    d3.min(historical, (d) => d.year)!,
    d3.max(historical, (d) => d.year)! + 1,
  );
  const historicalByYear = d3.group(historical, (d) => d.year);
  const regionalHistorical = historicalYears.map((year) => {
    const records = historicalByYear.get(year) || [];
    return {
      year,
      value: records.length ? d3.mean(records, (d) => d.value ?? NaN)! : null,
      count: new Set(records.map((d) => d.code)).size,
      stationCount: d3.sum(records, (d) => d.stationCount),
    };
  });

  return {
    countries,
    satelliteByCountry,
    historicalByCountry,
    summaryByCountry,
    regionalSatellite,
    regionalHistorical,
  };
}
