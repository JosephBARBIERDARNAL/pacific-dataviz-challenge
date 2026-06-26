export const COLORS = {
  navy: "#1a2b4b",
  satellite: "#65d2d9",
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
    end: 2025,
    label: "1947–2025",
    hyphenLabel: "1947-2025",
  },
  satellite: {
    start: 1993,
    end: 2023,
    label: "1993–2023",
    hyphenLabel: "1993-2023",
  },
  satelliteBaseline: {
    start: 1993,
    end: 2000,
    label: "1993–2000",
  },
  affected: {
    start: 2005,
    end: 2023,
    label: "2005–2023",
    hyphenLabel: "2005-2023",
  },
  losses: {
    start: 2007,
    end: 2020,
    label: "2007–2020",
    hyphenLabel: "2007-2020",
  },
} as const;

export const SCROLL_PROGRESS = {
  defaultTravelScreens: 1,
  defaultPinnedTravelScreens: 1.2,
  radialPinnedTravelScreens: 5,
  lockBufferPx: 300,
  viewportOffset: 0.08,
  viewportSpan: 0.78,
} as const;

export const RADIAL_CHART = {
  rollingMeanSpan: 5,
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
  curveAlpha: 0.5,
  fallbackFirstYear: 1950,
  guideYears: [1975, 2000, 2025],
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
  endLabelFontSize: { mobile: 12, desktop: 14 },
  endLabelOffset: 16,
  tangentSampleOffset: 1,
  leftAnchorThreshold: -0.2,
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

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export const prefersReducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
