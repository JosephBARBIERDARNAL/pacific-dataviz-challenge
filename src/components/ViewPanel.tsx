import * as d3 from "d3";
import { useMemo } from "react";
import { COLORS } from "../constants";
import { formatSignedValue } from "../lib/format";
import type { LineChartOptions } from "../lib/lineChart";
import type {
  ChartPoint,
  CountrySummary,
  SeaLevelData,
  View,
} from "../types";
import { LineChart } from "./LineChart";

interface Metric {
  label: string;
  value: string;
  detail: string;
}

function rankLabel(data: SeaLevelData, summary: CountrySummary): string {
  const summaries = [...data.summaryByCountry.values()];
  const betterCount = summaries.filter((d) => d.rise > summary.rise).length;
  const tied = summaries.filter((d) => d.rise === summary.rise).length;
  const rank = betterCount + 1;
  return tied > 1 ? `Joint #${rank}` : `#${rank}`;
}

function buildMetrics(
  data: SeaLevelData,
  summary: CountrySummary | null,
  satellite: ChartPoint[],
  historical: ChartPoint[],
): Metric[] {
  const validHistorical = historical.filter((d) => d.value != null);
  const latest = satellite.at(-1)!;

  if (summary) {
    return [
      {
        label: "1993–2023 change",
        value: `${formatSignedValue(summary.rise)} mm`,
        detail: "2019–2023 mean minus 1993–1997 mean",
      },
      {
        label: "Regional rank",
        value: rankLabel(data, summary),
        detail: `among ${data.countries.length} places by period change`,
      },
      {
        label: "Latest anomaly",
        value: `${formatSignedValue(latest.value!)} mm`,
        detail: `${latest.year} satellite-era value`,
      },
      {
        label: "Tide-gauge record",
        value: validHistorical.length ? String(validHistorical[0].year) : "None",
        detail: validHistorical.length
          ? "first available year; gaps may follow"
          : "no qualifying series in this dataset",
      },
    ];
  }

  return [
    {
      label: "Average 1993–2023 change",
      value: `${formatSignedValue(d3.mean(data.summaryByCountry.values(), (d) => d.rise)!)} mm`,
      detail: "mean of 21 country-level period changes",
    },
    {
      label: "Places compared",
      value: String(data.countries.length),
      detail: "complete satellite series from 1993–2023",
    },
    {
      label: "Latest regional anomaly",
      value: `${formatSignedValue(latest.value!)} mm`,
      detail: `${latest.year} equal-country mean`,
    },
    {
      label: "Historical coverage",
      value: String(data.historicalByCountry.size),
      detail: "countries with qualifying tide-gauge data",
    },
  ];
}

interface ViewPanelProps {
  data: SeaLevelData;
  selectedView: View;
  summary: CountrySummary | null;
  satellite: ChartPoint[];
  historical: ChartPoint[];
  isChanging: boolean;
}

export function ViewPanel({
  data,
  summary,
  satellite,
  historical,
  isChanging,
}: ViewPanelProps) {
  const isGlobal = !summary;
  const metrics = buildMetrics(data, summary, satellite, historical);

  const chartOptions = useMemo<LineChartOptions>(
    () => ({
      theme: "dark",
      color: COLORS.satellite,
      title: isGlobal
        ? "Pacific regional satellite-era sea-level anomaly, 1993 to 2023"
        : `${summary.country} satellite-era sea-level anomaly, 1993 to 2023`,
      description: isGlobal
        ? "A line shows the annual equal-country mean and a band shows the range across 21 countries."
        : `A line shows annual sea-level anomaly for ${summary.country}.`,
      range: isGlobal,
      directLabel: isGlobal ? "Satellite mean" : summary.country,
      tooltip: (d: ChartPoint) =>
        isGlobal
          ? [
              `${d.year}`,
              `Regional mean: ${formatSignedValue(d.value!)} mm`,
              `Country range: ${formatSignedValue(d.low!)} to ${formatSignedValue(d.high!)} mm`,
            ]
          : [`${d.year}`, `Anomaly: ${formatSignedValue(d.value!)} mm`],
    }),
    [isGlobal, summary],
  );

  return (
    <div
      id="view-panel"
      className={`view-panel${isChanging ? " is-changing" : ""}`}
      aria-labelledby="view-title"
      aria-live="polite"
    >
      <div className="view-heading">
        <div>
          <p id="view-kicker" className="eyebrow">
            {isGlobal
              ? "Regional overview · 21 places"
              : `Country view · ${summary.code}`}
          </p>
          <h2 id="view-title">
            {isGlobal
              ? "A shared direction, with local variation"
              : summary.country}
          </h2>
        </div>
        <p id="view-summary" className="view-summary">
          {isGlobal
            ? "The regional mean rises over the satellite era, but the range shows that annual conditions differ substantially from place to place."
            : `${summary.country} is compared with the same 1993–2023 satellite window used for every place in this story.`}
        </p>
      </div>

      <div id="metrics" className="metrics" aria-label="Key sea-level figures">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-detail">{metric.detail}</span>
          </div>
        ))}
      </div>

      <article className="chart-card chart-card--satellite">
        <header className="chart-header">
          <h3 id="satellite-title">
            {isGlobal
              ? "Regional mean and inter-country range"
              : `${summary.country} annual anomaly`}
          </h3>
          <p id="satellite-note" className="chart-note">
            {isGlobal
              ? "The line is the equal-country mean. The shaded band spans the lowest to highest country value each year."
              : "Same years and millimeter unit as every country view; values are not smoothed."}
          </p>
        </header>
        <LineChart id="satellite-chart" data={satellite} options={chartOptions} />
        <p id="satellite-caption" className="chart-caption">
          {isGlobal
            ? "The comparable record starts in 1993 because that is the first year available for all 21 places. It is not joined to the tide-gauge aggregate below."
            : "The headline change compares five-year averages at the beginning and end of the series, while the chart retains every annual observation."}
        </p>
      </article>
    </div>
  );
}
