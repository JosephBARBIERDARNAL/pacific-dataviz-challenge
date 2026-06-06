export const COLORS = {
  navy: "#1a2b4b",
  satellite: "#65d2d9",
  historical: "rgb(196, 150, 105)",
  white: "#ffffff",
} as const;

export const DATA_PATHS = {
  satellite: `${import.meta.env.BASE_URL}data/sea_level.csv`,
  historical: `${import.meta.env.BASE_URL}data/sea_level_historical.csv`,
  summary: `${import.meta.env.BASE_URL}data/country_summary.csv`,
  land: "https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json",
} as const;

export const PACIFIC_CENTER_ROTATION: [number, number, number] = [-170, 8, 0];

export const PLACE_COORDINATES = new Map<string, [number, number]>([
  ["AS", [-170.7, -14.27]],
  ["CK", [-159.78, -21.24]],
  ["FJ", [178.07, -17.71]],
  ["FM", [158.25, 6.89]],
  ["GU", [144.79, 13.44]],
  ["KI", [172.98, 1.45]],
  ["MH", [171.18, 7.13]],
  ["MP", [145.75, 15.18]],
  ["NC", [165.62, -21.3]],
  ["NR", [166.93, -0.52]],
  ["NU", [-169.87, -19.05]],
  ["PF", [-149.57, -17.68]],
  ["PG", [147.18, -6.31]],
  ["PW", [134.58, 7.51]],
  ["SB", [160.16, -9.65]],
  ["TK", [-171.85, -9.2]],
  ["TO", [-175.2, -21.18]],
  ["TV", [179.19, -8.52]],
  ["VU", [167.69, -16.17]],
  ["WF", [-176.2, -13.28]],
  ["WS", [-172.1, -13.76]],
]);

export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
