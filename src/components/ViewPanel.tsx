import * as d3 from "d3";
import { useMemo } from "react";
import { COLORS } from "../constants";
import {
  formatCompact,
  formatCurrency,
  formatSignedValue,
  reportedCurrency,
  reportedNumber,
} from "../lib/format";
import type { LineChartOptions } from "../lib/lineChart";
import type { ChartPoint, CountrySummary, SeaLevelData } from "../types";
import { LineChart } from "./LineChart";

interface Metric {
  label: string;
  value: string;
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
): Metric[] {
  if (summary) {
    return [
      {
        label: "1993–2023 change",
        value: `${formatSignedValue(summary.rise)} mm`,
      },
      {
        label: "Regional rank",
        value: rankLabel(data, summary),
      },
      {
        label: "People directly affected, 2005–2023",
        value: reportedNumber(summary.affected),
      },
      {
        label: "Reported disaster losses, 2007–2020",
        value: reportedCurrency(summary.losses),
      },
    ];
  }

  const allSummaries = [...data.summaryByCountry.values()];
  return [
    {
      label: "Average 1993–2023 change",
      value: `${formatSignedValue(d3.mean(allSummaries, (d) => d.rise)!)} mm`,
    },
    {
      label: "People directly affected, 2005–2023",
      value: formatCompact(d3.sum(allSummaries, (d) => d.affected)),
    },
    {
      label: "Reported disaster losses, 2007–2020",
      value: formatCurrency(d3.sum(allSummaries, (d) => d.losses)),
    },
  ];
}

interface ViewPanelProps {
  data: SeaLevelData;
  summary: CountrySummary | null;
  satellite: ChartPoint[];
  isChanging: boolean;
}

export function ViewPanel({
  data,
  summary,
  satellite,
  isChanging,
}: ViewPanelProps) {
  const isGlobal = !summary;
  const metrics = buildMetrics(data, summary);

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
      prominent: true,
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

      <div id="metrics" className="metrics" aria-label="Key sea-level figures">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span className="metric-label">{metric.label}</span>
            <span className="metric-value">{metric.value}</span>
          </div>
        ))}
      </div>
      <p className="metric-caveat">
        Disaster totals include all recorded disasters, not only coastal events.
        Reporting coverage varies; “Not reported” may reflect missing data.
      </p>

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
        <LineChart
          id="satellite-chart"
          data={satellite}
          options={chartOptions}
        />
      </article>
    </div>
  );
}
