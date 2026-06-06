import * as d3 from "d3";
import type { HistoricalPoint } from "../types";

/** Fill missing years with null-valued records so gaps render as gaps. */
export function denseHistorical(
  records: HistoricalPoint[] | undefined,
): HistoricalPoint[] {
  if (!records?.length) return [];

  const byYear = new Map(records.map((d) => [d.year, d]));
  return d3
    .range(d3.min(records, (d) => d.year)!, d3.max(records, (d) => d.year)! + 1)
    .map(
      (year) =>
        byYear.get(year) || {
          code: records[0].code,
          country: records[0].country,
          year,
          value: null,
          stationCount: 0,
        },
    );
}
