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
} as const;

export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
);
