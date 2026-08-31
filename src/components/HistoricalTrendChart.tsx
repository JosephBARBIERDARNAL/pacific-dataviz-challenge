import { useMemo } from "react";
import * as d3 from "d3";
import type { ChartPoint } from "../types";
import { formatSignedValue } from "../lib/format";

interface HistoricalTrendChartProps {
  data: ChartPoint[];
}

const WIDTH = 720;
const HEIGHT = 230;
const MARGIN = { top: 20, right: 24, bottom: 34, left: 48 };

function rollingMean(data: ChartPoint[], index: number): number {
  const values = data
    .slice(Math.max(0, index - 2), Math.min(data.length, index + 3))
    .map((datum) => datum.value)
    .filter((value): value is number => Number.isFinite(value));

  return d3.mean(values) ?? 0;
}

export function HistoricalTrendChart({ data }: HistoricalTrendChartProps) {
  const points = useMemo(
    () =>
      data
        .filter((datum) => Number.isFinite(datum.value))
        .map((datum, index, valid) => ({
          ...datum,
          smoothed: rollingMean(valid, index),
        })),
    [data],
  );
  const years = d3.extent(points, (datum) => datum.year) as [number, number];
  const maximum = Math.max(
    100,
    Math.ceil(
      Math.max(...points.map((datum) => Math.abs(datum.smoothed))) / 50,
    ) * 50,
  );
  const x = d3
    .scaleLinear()
    .domain(years)
    .range([MARGIN.left, WIDTH - MARGIN.right]);
  const y = d3
    .scaleLinear()
    .domain([-maximum, maximum])
    .range([HEIGHT - MARGIN.bottom, MARGIN.top]);
  const line = d3
    .line<(typeof points)[number]>()
    .x((datum) => x(datum.year))
    .y((datum) => y(datum.smoothed));
  const ticks = [-maximum, 0, maximum];
  const end = points.at(-1);

  return (
    <figure className="historical-trend" aria-labelledby="trend-heading">
      <figcaption>
        <strong id="trend-heading">Read the spiral as a timeline</strong>
        <span>
          The same up-to-five-year mean, shown on a conventional millimetre
          scale.
        </span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label={`A linear timeline of the selected tide-gauge context. The mean moves from ${formatSignedValue(points[0]?.smoothed ?? 0)} millimetres in ${points[0]?.year} to ${formatSignedValue(end?.smoothed ?? 0)} millimetres in ${end?.year}.`}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className={tick === 0 ? "trend-zero" : "trend-grid"}
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text className="trend-axis-label" x={MARGIN.left - 8} y={y(tick)}>
              {formatSignedValue(tick)}
            </text>
          </g>
        ))}
        <path className="trend-line" d={line(points) ?? ""} />
        {years.concat([1985]).filter((year, index, values) => values.indexOf(year) === index).map((year) => (
          <text
            className="trend-axis-label trend-year"
            key={year}
            x={x(year)}
            y={HEIGHT - 10}
          >
            {year}
          </text>
        ))}
        {end && (
          <>
            <circle className="trend-endpoint" cx={x(end.year)} cy={y(end.smoothed)} r={4} />
            <text className="trend-end-label" x={x(end.year) - 8} y={y(end.smoothed) - 10}>
              {formatSignedValue(end.smoothed)} mm
            </text>
          </>
        )}
      </svg>
    </figure>
  );
}
