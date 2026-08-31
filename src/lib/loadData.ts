import * as d3 from "d3";
import { DATA_PATHS, RECORD_RANGES } from "../constants";
import type { ChartPoint, CountrySummary, SeaLevelData } from "../types";

interface HistoricalRecord {
  code: string;
  year: number;
  value: number | null;
  stationCount: number;
}

function parseHistorical(row: d3.DSVRowString): HistoricalRecord {
  return {
    code: row.country_code!,
    year: +row.year!,
    value: +row.sea_level_anomaly_mm!,
    stationCount: +row.station_count!,
  };
}

function parseSummary(row: d3.DSVRowString): CountrySummary {
  return {
    code: row.country_code!,
    country: row.country!,
    early: +row.sea_level_1993_1997_mm!,
    recent: +row.sea_level_2019_2023_mm!,
    rise: +row.sea_level_rise_mm!,
  };
}

export async function loadSeaLevelData(): Promise<SeaLevelData> {
  const [historical, summaries] = await Promise.all([
    d3.csv(DATA_PATHS.historical, parseHistorical),
    d3.csv(DATA_PATHS.summary, parseSummary),
  ]);

  return prepareData(historical, summaries);
}

function prepareData(
  historical: HistoricalRecord[],
  summaries: CountrySummary[],
): SeaLevelData {
  const storyHistorical = historical.filter(
    (record) => record.year <= RECORD_RANGES.historical.end,
  );
  const historicalYears = d3.range(
    d3.min(storyHistorical, (d) => d.year)!,
    d3.max(storyHistorical, (d) => d.year)! + 1,
  );
  const historicalByYear = d3.group(storyHistorical, (d) => d.year);
  const regionalHistorical: ChartPoint[] = historicalYears.map((year) => {
    const records = historicalByYear.get(year) || [];
    return {
      year,
      value: records.length ? d3.mean(records, (d) => d.value ?? NaN)! : null,
      count: new Set(records.map((d) => d.code)).size,
      stationCount: d3.sum(records, (d) => d.stationCount),
    };
  });

  return {
    summaries,
    regionalHistorical,
  };
}
