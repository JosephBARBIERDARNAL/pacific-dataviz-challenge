import { useMemo, useState } from "react";
import * as d3 from "d3";
import type { ChartPoint } from "../types";
import { formatSignedValue } from "../lib/format";

interface HistoricalTrendChartProps {
  data: ChartPoint[];
}

const WIDTH = 720;
const HEIGHT = 310;
const MARGIN = { top: 18, right: 48, bottom: 34, left: 52 };
const LINE_BOTTOM = 182;
const COVERAGE_TOP = 220;
const COVERAGE_BOTTOM = 264;
const TOOLTIP_WIDTH = 214;
const TOOLTIP_HEIGHT = 96;

function rollingMean(data: ChartPoint[], index: number): number {
  const values = data
    .slice(Math.max(0, index - 2), Math.min(data.length, index + 3))
    .map((datum) => datum.value)
    .filter((value): value is number => Number.isFinite(value));

  return d3.mean(values) ?? 0;
}

function pluralize(value: number, singular: string, plural: string): string {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function HistoricalTrendChart({ data }: HistoricalTrendChartProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const points = useMemo(
    () =>
      data
        .filter(
          (datum): datum is ChartPoint & { value: number } =>
            typeof datum.value === "number" && Number.isFinite(datum.value),
        )
        .map((datum, index, valid) => ({
          ...datum,
          smoothed: rollingMean(valid, index),
        })),
    [data],
  );

  if (points.length === 0) return null;

  const years = d3.extent(points, (datum) => datum.year) as [number, number];
  const maximum = Math.max(
    100,
    Math.ceil(
      Math.max(...points.map((datum) => Math.abs(datum.smoothed))) / 50,
    ) * 50,
  );
  const maximumCountryCount = Math.max(
    ...points.map((datum) => datum.count ?? 0),
    1,
  );
  const x = d3
    .scaleLinear()
    .domain(years)
    .range([MARGIN.left, WIDTH - MARGIN.right]);
  const y = d3
    .scaleLinear()
    .domain([-maximum, maximum])
    .range([LINE_BOTTOM, MARGIN.top]);
  const coverageY = d3
    .scaleLinear()
    .domain([0, maximumCountryCount])
    .range([COVERAGE_BOTTOM, COVERAGE_TOP]);
  const line = d3
    .line<(typeof points)[number]>()
    .x((datum) => x(datum.year))
    .y((datum) => y(datum.smoothed));
  const ticks = [-maximum, 0, maximum];
  const displayedIndex = selectedIndex ?? points.length - 1;
  const selected = points[displayedIndex] ?? points.at(-1)!;
  const tooltipX = Math.max(
    MARGIN.left,
    Math.min(
      x(selected.year) - TOOLTIP_WIDTH / 2,
      WIDTH - MARGIN.right - TOOLTIP_WIDTH,
    ),
  );
  const tooltipY = Math.max(
    MARGIN.top,
    Math.min(
      y(selected.smoothed) - TOOLTIP_HEIGHT - 12,
      LINE_BOTTOM - TOOLTIP_HEIGHT,
    ),
  );
  const barWidth = Math.max(
    3,
    ((WIDTH - MARGIN.left - MARGIN.right) / points.length) * 0.72,
  );
  const focusYear = (index: number) => setSelectedIndex(index);

  return (
    <figure className="historical-trend" aria-labelledby="trend-heading">
      <figcaption>
        <strong id="trend-heading">Trend and changing annual coverage</strong>
        <span>Hover or focus a year for the complete tide-gauge context.</span>
      </figcaption>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        role="img"
        aria-label="A combined annual tide-gauge chart. The line shows the five-year smoothed sea-level anomaly and the bars show countries contributing each year."
        onPointerMove={(event) => {
          const bounds = event.currentTarget.getBoundingClientRect();
          const pointerYear = x.invert(
            ((event.clientX - bounds.left) / bounds.width) * WIDTH,
          );
          focusYear(
            Math.max(
              0,
              Math.min(
                points.length - 1,
                d3.bisectCenter(
                  points.map((datum) => datum.year),
                  pointerYear,
                ),
              ),
            ),
          );
        }}
        onPointerLeave={() => setSelectedIndex(null)}
      >
        <desc>
          Sea-level anomaly is measured in millimetres relative to each
          station&apos;s 1993–2000 baseline. Coverage bars show the number of
          contributing countries.
        </desc>
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
        <text className="trend-axis-title" x={MARGIN.left} y={12}>
          Sea-level anomaly (mm)
        </text>
        <path className="trend-line" d={line(points) ?? ""} />
        <line
          className="coverage-divider"
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={204}
          y2={204}
        />
        <text className="coverage-chart-label" x={MARGIN.left} y={216}>
          Countries contributing each year
        </text>
        <text
          className="coverage-chart-label"
          x={WIDTH - MARGIN.right}
          y={216}
          textAnchor="end"
        >
          {maximumCountryCount} max.
        </text>
        {points.map((datum) => (
          <rect
            className="coverage-bar"
            key={datum.year}
            x={x(datum.year) - barWidth / 2}
            y={coverageY(datum.count ?? 0)}
            width={barWidth}
            height={COVERAGE_BOTTOM - coverageY(datum.count ?? 0)}
          />
        ))}
        <line
          className="coverage-baseline"
          x1={MARGIN.left}
          x2={WIDTH - MARGIN.right}
          y1={COVERAGE_BOTTOM}
          y2={COVERAGE_BOTTOM}
        />
        {[years[0], 1985, years[1]]
          .filter((year, index, values) => values.indexOf(year) === index)
          .map((year) => (
            <text
              className="trend-axis-label trend-year"
              key={year}
              x={x(year)}
              y={HEIGHT - 12}
            >
              {year}
            </text>
          ))}
        <line
          className="trend-selection"
          x1={x(selected.year)}
          x2={x(selected.year)}
          y1={MARGIN.top}
          y2={COVERAGE_BOTTOM}
        />
        <circle
          className="trend-endpoint"
          cx={x(selected.year)}
          cy={y(selected.smoothed)}
          r={4}
        />
        <g
          className="trend-tooltip"
          transform={`translate(${tooltipX}, ${tooltipY})`}
        >
          <rect width={TOOLTIP_WIDTH} height={TOOLTIP_HEIGHT} rx={4} />
          <text className="trend-tooltip-year" x={10} y={17}>
            {selected.year}
          </text>
          <text x={10} y={35}>
            Annual mean: {formatSignedValue(selected.value)} mm
          </text>
          <text x={10} y={51}>
            5-year mean: {formatSignedValue(selected.smoothed)} mm
          </text>
          <text x={10} y={67}>
            Coverage: {pluralize(selected.count ?? 0, "country", "countries")} ·{" "}
            {pluralize(selected.stationCount ?? 0, "station", "stations")}
          </text>
          <text x={10} y={83}>
            Anomaly vs. 1993–2000 baseline
          </text>
        </g>
        {points.map((datum, index) => (
          <rect
            className="trend-hit-area"
            key={datum.year}
            x={x(datum.year) - barWidth / 2}
            y={MARGIN.top}
            width={barWidth}
            height={COVERAGE_BOTTOM - MARGIN.top}
            tabIndex={0}
            role="graphics-symbol"
            aria-label={`${datum.year}: annual mean ${formatSignedValue(datum.value)} millimetres; five-year mean ${formatSignedValue(datum.smoothed)} millimetres; ${pluralize(datum.count ?? 0, "country", "countries")}; ${pluralize(datum.stationCount ?? 0, "station", "stations")}; anomaly relative to the 1993 to 2000 baseline.`}
            onFocus={() => focusYear(index)}
            onKeyDown={(event) => {
              if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
                event.preventDefault();
                focusYear(Math.max(0, index - 1));
              }
              if (event.key === "ArrowRight" || event.key === "ArrowUp") {
                event.preventDefault();
                focusYear(Math.min(points.length - 1, index + 1));
              }
            }}
          />
        ))}
      </svg>
    </figure>
  );
}
