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

export const ASSET_PATHS = {
  logo: `${import.meta.env.BASE_URL}image/logo.png`,
} as const;

export const VIEW_QUERY_PARAM = "view";
export const GLOBAL_VIEW = "global";

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

export const DATA_COVERAGE = {
  satellitePlaces: 21,
  historicalPlaces: 12,
} as const;

export const SCROLL_PROGRESS = {
  defaultTravelScreens: 1,
  defaultPinnedTravelScreens: 1.2,
  radialPinnedTravelScreens: 5,
  lockBufferPx: 300,
  viewportOffset: 0.08,
  viewportSpan: 0.78,
} as const;

export const LINE_CHART = {
  minWidth: 300,
  mobileBreakpoint: 560,
  height: {
    countStrip: { mobile: 480, desktop: 640 },
    prominent: { mobile: 460, desktop: 680 },
    default: { mobile: 420, desktop: 560 },
  },
  margin: {
    top: 36,
    right: { mobile: 22, countStrip: 190, default: 128 },
    bottom: { countStrip: 126, default: 62 },
    left: { mobile: 58, desktop: 72 },
  },
  yPadding: { min: 8, ratio: 0.05 },
  ticks: { mobile: 4, desktop: 6, xDesktop: 7 },
  axis: {
    labelY: 16,
    labelFontSize: 12,
    zeroStrokeWidth: 1.4,
    xTickPadding: 11,
    yTickPadding: 10,
  },
  rangeLabel: {
    positionRatio: 0.18,
    yOffset: 10,
    minOffset: 14,
    fontSize: 12,
  },
  line: {
    fadeDurationMs: 220,
    shadowOpacity: 0.65,
    shadowWidth: 5,
    strokeWidth: { prominent: 4, default: 3 },
  },
  directLabel: {
    mobileXOffset: -4,
    desktopXOffset: 10,
    yOffset: 12,
    minOffset: 14,
    fontSize: 12,
  },
  countStrip: {
    topOffset: 50,
    bottomOffset: 20,
    minBarWidth: 1,
    barGap: 0.5,
    barFillOpacity: 0.8,
    barStrokeOpacity: 0.65,
    barStrokeWidth: 0.5,
    labelYOffset: { mobile: 12, desktop: 8 },
    labelMinOffset: 12,
    labelFontSize: 12,
  },
  interaction: {
    fallbackYFromTop: 8,
    tooltipXPadding: 80,
    tooltipMinTop: 62,
    focusCircleRadius: 5,
    focusStrokeWidth: 1.5,
    focusStrokeOpacity: 0.48,
    focusStrokeDasharray: "3 4",
  },
  theme: {
    subtle: { dark: "rgba(255,255,255,0.75)", light: "rgba(26,43,75,0.70)" },
    grid: { dark: "rgba(255,255,255,0.16)", light: "rgba(26,43,75,0.12)" },
    zero: { dark: "rgba(255,255,255,0.48)", light: "rgba(26,43,75,0.45)" },
  },
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
  guideLengthDivisor: 5,
  guideLabelOffset: 18,
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
