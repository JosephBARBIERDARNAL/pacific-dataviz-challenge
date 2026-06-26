export interface CountrySummary {
  rise: number;
  affected: number;
  losses: number;
}

export interface SeaLevelData {
  summaries: CountrySummary[];
  regionalHistorical: ChartPoint[];
}

/** A point any line chart can draw: a year plus an optional value. */
export interface ChartPoint {
  year: number;
  value: number | null;
  low?: number;
  high?: number;
  count?: number;
  stationCount?: number;
}
