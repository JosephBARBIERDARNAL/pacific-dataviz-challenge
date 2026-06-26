import * as d3 from "d3";
import { COLORS, prefersReducedMotion } from "../constants";
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

function rollingMean(data: ChartPoint[], index: number, span = 5): number {
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

export function drawRadialChart(
  container: HTMLElement,
  data: ChartPoint[],
): RadialChartHandle {
  const width = Math.max(320, container.clientWidth || 320);
  const mobile = width < 680;
  const height = mobile ? Math.max(520, width * 1.16) : Math.min(860, width);
  const size = Math.min(width, height);
  const centerX = width / 2;
  const centerY = height / 2;
  const innerRadius = size * (mobile ? 0.13 : 0.12);
  const outerRadius = size * (mobile ? 0.34 : 0.36);
  const anomalyBand = size * (mobile ? 0.08 : 0.085);

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
    .range([(-115 * Math.PI) / 180, (620 * Math.PI) / 180]);
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
      "A radial spiral shows the five-year smoothed regional tide-gauge sea-level anomaly from the late 1940s through 2025.",
    );

  const line = d3
    .line<RadialDatum>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(d3.curveCatmullRom.alpha(0.5));

  const grid = svg.append("g").attr("aria-hidden", "true");
  const guideYears = [1950, 1975, 2000, 2025];

  guideYears.forEach((year) => {
    const guideT = t(year);
    const guideAngle = angle(guideT);
    const guideRadius = radius(guideT);
    const x1 = centerX + Math.cos(guideAngle) * (guideRadius - anomalyBand);
    const y1 = centerY + Math.sin(guideAngle) * (guideRadius - anomalyBand);
    const x2 = centerX + Math.cos(guideAngle) * (guideRadius + anomalyBand);
    const y2 = centerY + Math.sin(guideAngle) * (guideRadius + anomalyBand);

    grid
      .append("line")
      .attr("x1", x1)
      .attr("y1", y1)
      .attr("x2", x2)
      .attr("y2", y2)
      .attr("stroke", "rgba(255,255,255,0.14)")
      .attr("stroke-width", 1);

    grid
      .append("text")
      .attr("x", centerX + Math.cos(guideAngle) * (guideRadius + anomalyBand + 18))
      .attr("y", centerY + Math.sin(guideAngle) * (guideRadius + anomalyBand + 18))
      .attr("fill", "rgba(255,255,255,0.6)")
      .attr("font-size", mobile ? 10 : 12)
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
    .attr("stroke", "rgba(255,255,255,0.2)")
    .attr("stroke-width", 1.5)
    .attr("stroke-dasharray", "4 7");

  grid
    .append("circle")
    .attr("cx", centerX)
    .attr("cy", centerY)
    .attr("r", innerRadius - 18)
    .attr("fill", "rgba(255,255,255,0.035)")
    .attr("stroke", "rgba(255,255,255,0.12)");

  const linePath = svg
    .append("path")
    .datum(points)
    .attr("d", line)
    .attr("fill", "none")
    .attr("stroke", COLORS.historical)
    .attr("stroke-width", mobile ? 4 : 5.5)
    .attr("stroke-linejoin", "round")
    .attr("stroke-linecap", "round");

  const totalLength = (linePath.node() as SVGPathElement).getTotalLength();
  linePath
    .attr("stroke-dasharray", totalLength)
    .attr("stroke-dashoffset", totalLength);

  const marker = svg
    .append("circle")
    .attr("r", mobile ? 5 : 6.5)
    .attr("fill", COLORS.white)
    .attr("stroke", COLORS.historical)
    .attr("stroke-width", 3);

  const readout = svg
    .append("g")
    .attr("class", "radial-readout")
    .attr("transform", `translate(${centerX},${centerY})`);

  readout
    .append("text")
    .attr("class", "radial-readout-year")
    .attr("y", -8)
    .attr("text-anchor", "middle");
  readout
    .append("text")
    .attr("class", "radial-readout-value")
    .attr("y", 28)
    .attr("text-anchor", "middle");

  const endLabel = svg
    .append("text")
    .attr("class", "radial-end-label")
    .attr("fill", COLORS.white)
    .attr("font-family", "var(--heading)")
    .attr("font-size", mobile ? 12 : 14)
    .attr("font-weight", 700);

  function update(progress: number) {
    const finalProgress = prefersReducedMotion.matches ? 1 : progress;
    const clamped = Math.max(0, Math.min(1, finalProgress));
    const pathPosition = totalLength * clamped;
    const point = (linePath.node() as SVGPathElement).getPointAtLength(
      pathPosition,
    );
    const index = Math.min(
      points.length - 1,
      Math.max(0, Math.round((points.length - 1) * clamped)),
    );
    const datum = points[index];

    linePath
      .attr("stroke-dashoffset", totalLength * (1 - clamped))
      .attr("opacity", Math.min(1, clamped * 2));
    marker.attr("cx", point.x).attr("cy", point.y).attr("opacity", clamped);
    readout.attr("opacity", clamped > 0 ? 1 : 0);
    readout.select(".radial-readout-year").text(datum.year);
    readout
      .select(".radial-readout-value")
      .text(`${formatSignedValue(datum.smoothed)} mm`);

    const labelAngle = datum.angle;
    endLabel
      .attr("x", datum.x + Math.cos(labelAngle) * 18)
      .attr("y", datum.y + Math.sin(labelAngle) * 18)
      .attr("text-anchor", Math.cos(labelAngle) < -0.2 ? "end" : "start")
      .attr("dominant-baseline", "middle")
      .attr("opacity", clamped > 0 ? 1 : 0)
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
