import * as d3 from "d3";
import { DATA_PATHS } from "../constants";
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
    rise: +row.sea_level_rise_mm!,
    affected: +row.affected_people_2005_2023!,
    losses: +row.loss_usd_2007_2020!,
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
  const historicalYears = d3.range(
    d3.min(historical, (d) => d.year)!,
    d3.max(historical, (d) => d.year)! + 1,
  );
  const historicalByYear = d3.group(historical, (d) => d.year);
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
