import * as d3 from "d3";
import {
  COLORS,
  RADIAL_CHART,
  RECORD_RANGES,
  prefersReducedMotion,
} from "../constants";
import type { ChartPoint } from "../types";
import { formatSignedValue } from "./format";

interface RadialDatum {
  year: number;
  value: number;
  smoothed: number;
  count: number;
  stationCount: number;
  angle: number;
  baseRadius: number;
  radius: number;
  x: number;
  y: number;
}

export interface RadialChartHandle {
  update: (progress: number) => void;
  cleanup: () => void;
}

function rollingMean(
  data: ChartPoint[],
  index: number,
  span = RADIAL_CHART.rollingMeanSpan,
): number {
  const half = Math.floor(span / 2);
  const values = data
    .slice(Math.max(0, index - half), Math.min(data.length, index + half + 1))
    .map((d) => d.value)
    .filter((value): value is number => Number.isFinite(value));

  return d3.mean(values) ?? (data[index].value as number);
}

function pointLabel(datum: RadialDatum): string {
  return `${datum.year}: ${formatSignedValue(datum.smoothed)} mm`;
}

function pathPointAt(
  path: SVGPathElement,
  length: number,
  totalLength: number,
): DOMPoint {
  return path.getPointAtLength(Math.max(0, Math.min(totalLength, length)));
}

export function drawRadialChart(
  container: HTMLElement,
  data: ChartPoint[],
): RadialChartHandle {
  const width = Math.max(
    RADIAL_CHART.minWidth,
    container.clientWidth || RADIAL_CHART.minWidth,
  );
  const mobile = width < RADIAL_CHART.mobileBreakpoint;
  const height = mobile
    ? Math.max(
        RADIAL_CHART.height.mobileMin,
        width * RADIAL_CHART.height.mobileWidthRatio,
      )
    : Math.min(RADIAL_CHART.height.desktopMax, width);
  const size = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius =
    size *
    (mobile
      ? RADIAL_CHART.radius.inner.mobile
      : RADIAL_CHART.radius.inner.desktop);
  const outerRadius =
    size *
    (mobile
      ? RADIAL_CHART.radius.outer.mobile
      : RADIAL_CHART.radius.outer.desktop);
  const anomalyBand =
    size *
    (mobile
      ? RADIAL_CHART.radius.anomalyBand.mobile
      : RADIAL_CHART.radius.anomalyBand.desktop);

  const valid = data.filter((d) => Number.isFinite(d.value));
  const smoothed = valid.map((d, index) => ({
    ...d,
    smoothed: rollingMean(valid, index),
  }));
  const valueExtent = d3.extent(smoothed, (d) => d.smoothed) as [
    number,
    number,
  ];
  const maxAbs = Math.max(Math.abs(valueExtent[0]), Math.abs(valueExtent[1]));
  const anomaly = d3
    .scaleLinear()
    .domain([-maxAbs, maxAbs])
    .range([-anomalyBand, anomalyBand]);
  const t = d3
    .scaleLinear()
    .domain(d3.extent(smoothed, (d) => d.year) as [number, number])
    .range([0, 1]);
  const angle = d3
    .scaleLinear()
    .domain([0, 1])
    .range([
      (RADIAL_CHART.angleDegrees.start * Math.PI) / 180,
      (RADIAL_CHART.angleDegrees.end * Math.PI) / 180,
    ]);
  const radius = d3
    .scaleLinear()
    .domain([0, 1])
    .range([innerRadius, outerRadius]);

  const points: RadialDatum[] = smoothed.map((d) => {
    const yearT = t(d.year);
    const pointAngle = angle(yearT);
    const baseRadius = radius(yearT);
    const pointRadius = baseRadius + anomaly(d.smoothed);
    return {
      year: d.year,
      value: d.value as number,
      smoothed: d.smoothed,
      count: d.count ?? 0,
      stationCount: d.stationCount ?? 0,
      angle: pointAngle,
      baseRadius,
      radius: pointRadius,
      x: centerX + Math.cos(pointAngle) * pointRadius,
      y: centerY + Math.sin(pointAngle) * pointRadius,
    };
  });

  const baselinePoints = points.map((d) => ({
    ...d,
    radius: d.baseRadius,
    x: centerX + Math.cos(d.angle) * d.baseRadius,
    y: centerY + Math.sin(d.angle) * d.baseRadius,
  }));

  d3.select(container).selectAll("*").remove();

  const idBase = container.id || "radial-chart";
  const svg = d3
    .select(container)
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("role", "img")
    .attr("aria-labelledby", `${idBase}-title ${idBase}-desc`);

  svg
    .append("title")
    .attr("id", `${idBase}-title`)
    .text("Pacific regional tide-gauge sea-level anomaly");
  svg
    .append("desc")
    .attr("id", `${idBase}-desc`)
    .text(
      `A radial spiral shows the ${RADIAL_CHART.rollingMeanSpan}-year smoothed regional tide-gauge sea-level anomaly from the late 1940s through ${RECORD_RANGES.historical.end}.`,
    );

  const line = d3
    .line<RadialDatum>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(d3.curveCatmullRom.alpha(RADIAL_CHART.curveAlpha));

  const grid = svg.append("g").attr("aria-hidden", "true");
  const firstYear = points[0]?.year ?? RADIAL_CHART.fallbackFirstYear;
  const guideYears = Array.from(
    new Set([firstYear, ...RADIAL_CHART.guideYears]),
  );

  guideYears.forEach((year) => {
    const guideT = t(year);
    const guideAngle = angle(guideT);
    const guideRadius = radius(guideT);
    const guideLength = anomalyBand / RADIAL_CHART.guideLengthDivisor;
    const x1 = centerX + Math.cos(guideAngle) * (guideRadius - guideLength);
    const y1 = centerY + Math.sin(guideAngle) * (guideRadius - guideLength);
    const x2 = centerX + Math.cos(guideAngle) * (guideRadius + guideLength);
    const y2 = centerY + Math.sin(guideAngle) * (guideRadius + guideLength);

    grid
      .append("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .attr("stroke", RADIAL_CHART.colors.guideStroke)
      .attr("stroke-width", RADIAL_CHART.guideStrokeWidth);

    grid
      .append("text")
      .attr(
        "x",
        centerX +
          Math.cos(guideAngle) *
            (guideRadius + anomalyBand + RADIAL_CHART.guideLabelOffset),
      )
      .attr(
        "y",
        centerY +
          Math.sin(guideAngle) *
            (guideRadius + anomalyBand + RADIAL_CHART.guideLabelOffset),
      )
      .attr("fill", RADIAL_CHART.colors.guideText)
      .attr(
        "font-size",
        mobile
          ? RADIAL_CHART.guideFontSize.mobile
          : RADIAL_CHART.guideFontSize.desktop,
      )
      .attr("font-family", "var(--heading)")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "middle")
      .text(year);
  });

  grid
    .append("path")
    .datum(baselinePoints)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", RADIAL_CHART.colors.baselineStroke)
    .attr("stroke-width", RADIAL_CHART.baselineStrokeWidth)
    .attr("stroke-dasharray", RADIAL_CHART.baselineDasharray);

  grid
    .append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", innerRadius - RADIAL_CHART.centerCircleInset)
    .attr("fill", RADIAL_CHART.colors.centerFill)
    .attr("stroke", RADIAL_CHART.colors.centerStroke);

  const linePath = svg
    .append("path")
    .datum(points)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", COLORS.historical)
    .attr(
      "stroke-width",
      mobile
        ? RADIAL_CHART.lineStrokeWidth.mobile
        : RADIAL_CHART.lineStrokeWidth.desktop,
    )
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  const totalLength = (linePath.node() as SVGPathElement).getTotalLength();
  linePath
    .attr("stroke-dasharray", totalLength)
    .attr("stroke-dashoffset", totalLength);

  const marker = svg
    .append("circle")
    .attr(
      "r",
      mobile
        ? RADIAL_CHART.markerRadius.mobile
        : RADIAL_CHART.markerRadius.desktop,
    )
    .attr("fill", COLORS.white)
    .attr("stroke", COLORS.historical)
    .attr("stroke-width", RADIAL_CHART.markerStrokeWidth);

  const readout = svg
    .append("g")
    .attr("class", "radial-readout")
    .attr("transform", `translate(${centerX},${centerY})`);

  readout
    .append("text")
    .attr("class", "radial-readout-year")
    .attr("y", 0)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle");
  readout
    .append("text")
    .attr("class", "radial-readout-value")
    .attr("y", RADIAL_CHART.readoutValueY)
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle");

  const endLabel = svg
    .append("text")
    .attr("class", "radial-end-label")
    .attr("fill", COLORS.white)
    .attr("font-family", "var(--heading)")
    .attr(
      "font-size",
      mobile
        ? RADIAL_CHART.endLabelFontSize.mobile
        : RADIAL_CHART.endLabelFontSize.desktop,
    )
    .attr("font-weight", 700);

  function update(progress: number) {
    const finalProgress = prefersReducedMotion.matches ? 1 : progress;
    const clamped = Math.max(0, Math.min(1, finalProgress));
    const pathPosition = totalLength * clamped;
    const path = linePath.node() as SVGPathElement;
    const point = pathPointAt(path, pathPosition, totalLength);
    const index = Math.min(
      points.length - 1,
      Math.max(0, Math.round((points.length - 1) * clamped)),
    );
    const datum = points[index];

    linePath
      .attr("stroke-dashoffset", totalLength * (1 - clamped))
      .attr("opacity", 1);
    marker.attr("cx", point.x).attr("cy", point.y).attr("opacity", 1);
    readout.attr("opacity", 1);
    readout.select(".radial-readout-year").text(datum.year);
    readout
      .select(".radial-readout-value")
      .text(`${formatSignedValue(datum.smoothed)} mm`);

    const previousPoint = pathPointAt(
      path,
      pathPosition - RADIAL_CHART.tangentSampleOffset,
      totalLength,
    );
    const nextPoint = pathPointAt(
      path,
      pathPosition + RADIAL_CHART.tangentSampleOffset,
      totalLength,
    );
    const tangentAngle = Math.atan2(
      nextPoint.y - previousPoint.y,
      nextPoint.x - previousPoint.x,
    );
    const labelX =
      point.x + Math.cos(tangentAngle) * RADIAL_CHART.endLabelOffset;
    const labelY =
      point.y + Math.sin(tangentAngle) * RADIAL_CHART.endLabelOffset;

    endLabel
      .attr("x", labelX)
      .attr("y", labelY)
      .attr(
        "text-anchor",
        Math.cos(tangentAngle) < RADIAL_CHART.leftAnchorThreshold
          ? "end"
          : "start",
      )
      .attr("dominant-baseline", "middle")
      .attr("opacity", 1)
      .text(pointLabel(datum));
  }

  update(prefersReducedMotion.matches ? 1 : 0);

  return {
    update,
    cleanup: () => {
      svg.interrupt();
      d3.select(container).selectAll("*").remove();
    },
  };
}
