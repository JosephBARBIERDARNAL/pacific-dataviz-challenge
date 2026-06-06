export interface SatellitePoint {
  code: string;
  country: string;
  year: number;
  value: number;
}

export interface HistoricalPoint {
  code: string;
  country: string;
  year: number;
  value: number | null;
  stationCount: number;
}

export interface RegionalSatellitePoint {
  year: number;
  value: number;
  low: number;
  high: number;
  count: number;
}

export interface RegionalHistoricalPoint {
  year: number;
  value: number | null;
  count: number;
  stationCount: number;
}

export interface CountrySummary {
  code: string;
  country: string;
  earlyMean: number;
  recentMean: number;
  rise: number;
  affected: number;
  losses: number;
}

export interface CountryOption {
  code: string;
  country: string;
}

export interface SeaLevelData {
  countries: CountryOption[];
  satelliteByCountry: Map<string, SatellitePoint[]>;
  historicalByCountry: Map<string, HistoricalPoint[]>;
  summaryByCountry: Map<string, CountrySummary>;
  regionalSatellite: RegionalSatellitePoint[];
  regionalHistorical: RegionalHistoricalPoint[];
}

/** "global" or an ISO-style place code present in the summary data. */
export type View = string;

export type ChartRecord = "satellite" | "historical";

/** A point any line chart can draw: a year plus an optional value. */
export interface ChartPoint {
  year: number;
  value: number | null;
  low?: number;
  high?: number;
  count?: number;
  stationCount?: number;
}
