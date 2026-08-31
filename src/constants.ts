export const COLORS = {
  navy: "#1a2b4b",
  historical: "rgb(196, 150, 105)",
  white: "#ffffff",
} as const;

export const DATA_PATHS = {
  historical: `${import.meta.env.BASE_URL}data/sea_level_historical.csv`,
  summary: `${import.meta.env.BASE_URL}data/country_summary.csv`,
} as const;

export const ASSET_PATHS = {
  logo: `${import.meta.env.BASE_URL}image/logo.png`,
} as const;

export const RECORD_RANGES = {
  historical: {
    start: 1947,
    end: 2023,
    hyphenLabel: "1947-2023",
  },
} as const;

export const SCROLL_PROGRESS = {
  defaultPinnedTravelScreens: 1.2,
  radialPinnedTravelScreens: 3,
  lockBufferPx: 300,
} as const;

export const RADIAL_CHART = {
  minWidth: 320,
  mobileBreakpoint: 680,
  height: {
    mobileMin: 520,
    mobileWidthRatio: 1.16,
    desktopMax: 860,
  },
  radius: {
    inner: { mobile: 0.13, desktop: 0.12 },
    outer: { mobile: 0.34, desktop: 0.36 },
    anomalyBand: { mobile: 0.08, desktop: 0.085 },
  },
  angleDegrees: { start: -115, end: 620 },
  rollingMeanSpan: 5,
  curveAlpha: 0.5,
  fallbackFirstYear: 1950,
  guideYears: [1975, 2000, 2023],
  guideLengthDivisor: 7,
  guideLabelOffset: -35,
  guideStrokeWidth: 2,
  guideFontSize: { mobile: 10, desktop: 12 },
  centerCircleInset: 18,
  baselineStrokeWidth: 1.5,
  baselineDasharray: "4 7",
  lineStrokeWidth: { mobile: 4, desktop: 5.5 },
  markerRadius: { mobile: 5, desktop: 6.5 },
  markerStrokeWidth: 3,
  readoutValueY: 36,
  readoutAnnualY: 58,
  readoutCoverageY: 78,
  colors: {
    guideStroke: "rgba(255,255,255,0.14)",
    guideText: "rgba(255,255,255,0.6)",
    baselineStroke: "rgba(255,255,255,0.2)",
    centerFill: "rgba(255,255,255,0.035)",
    centerStroke: "rgba(255,255,255,0.12)",
  },
} as const;

export const RESIZE_OBSERVER = {
  widthPrecision: 1,
} as const;

const STATIC_CHART_QUERY =
  "(prefers-reduced-motion: reduce), (max-height: 600px) and (orientation: landscape)";

export const prefersStaticChart = window.matchMedia(STATIC_CHART_QUERY);
