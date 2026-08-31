export interface CountrySummary {
  code: string;
  country: string;
  early: number;
  recent: number;
  rise: number;
}

export interface SeaLevelData {
  summaries: CountrySummary[];
  regionalHistorical: ChartPoint[];
}

export interface ChartPoint {
  year: number;
  value: number | null;
  count?: number;
  stationCount?: number;
}
