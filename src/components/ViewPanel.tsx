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
import type {
  ChartPoint,
  ChartRecord,
  CountrySummary,
  SeaLevelData,
} from "../types";
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
  historical: ChartPoint[];
  selectedRecord: ChartRecord;
  isChanging: boolean;
}

export function ViewPanel({
  data,
  summary,
  satellite,
  historical,
  selectedRecord,
  isChanging,
}: ViewPanelProps) {
  const isGlobal = !summary;
  const metrics = buildMetrics(data, summary);
  const validHistorical = historical.filter((d) => d.value != null);
  const hasHistorical = isGlobal || validHistorical.length > 0;
  const placeName = isGlobal ? "Pacific region" : summary.country;

  const satelliteOptions = useMemo<LineChartOptions>(
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

  const historicalOptions = useMemo<LineChartOptions>(
    () => ({
      theme: "dark",
      color: COLORS.historical,
      title: isGlobal
        ? "Pacific regional historical tide-gauge anomaly with country contributor counts"
        : `${summary.country} historical tide-gauge anomaly`,
      description: isGlobal
        ? "A line shows the annual equal-country tide-gauge mean. A strip shows how many countries contribute each year."
        : `A line shows available annual tide-gauge anomalies for ${summary.country}; missing years create gaps.`,
      countStrip: isGlobal,
      directLabel: isGlobal ? "Tide-gauge mean" : summary.country,
      tooltip: (d: ChartPoint) => {
        if (isGlobal) {
          return [
            `${d.year}`,
            d.value == null
              ? "Regional mean: no observation"
              : `Regional mean: ${formatSignedValue(d.value)} mm`,
            `Countries contributing: ${d.count}`,
            `Stations contributing: ${d.stationCount}`,
          ];
        }
        return [
          `${d.year}`,
          d.value == null
            ? "No tide-gauge observation"
            : `Anomaly: ${formatSignedValue(d.value)} mm`,
          d.value == null ? "" : `Stations contributing: ${d.stationCount}`,
        ].filter(Boolean);
      },
    }),
    [isGlobal, summary],
  );

  const showingSatellite = selectedRecord === "satellite";

  return (
    <div
      id="view-panel"
      className={`view-panel${isChanging ? " is-changing" : ""}`}
      aria-labelledby="view-title"
      aria-live="polite"
    >
      <section className="measure-summary" aria-label="Current chart measure">
        <p className="eyebrow">Currently showing · {placeName}</p>
        <h2 id="view-title">
          {showingSatellite
            ? "Satellite-era sea-level anomaly"
            : "Historical tide-gauge anomaly"}
        </h2>
        <p className="measure-description">
          {showingSatellite
            ? isGlobal
              ? "A consistent 1993–2023 record across 21 places. The line is the equal-country annual mean; the shaded band shows the full range between countries."
              : `A consistent annual record for ${summary.country} from 1993 to 2023. Values are sea-level differences from the dataset’s reference level, measured in millimeters.`
            : isGlobal
              ? "A longer but selective station record from 1947 to 2025. Each station is measured relative to its own 1993–2000 mean, and the number of contributing countries changes over time."
              : `Available station observations for ${summary.country}, measured relative to each station’s 1993–2000 mean. Missing years are left as gaps rather than estimated.`}
        </p>
        <p className="record-comparison">
          Satellite data are consistent across all 21 places; tide gauges reach
          further back but cover only 12 places and vary by station and year.
          The two records should be compared, not joined into one line.
        </p>
      </section>

      <p className="metrics-heading">
        1993–2023 satellite change and reported disaster context
      </p>
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

      {showingSatellite ? (
        <article className="chart-card chart-card--satellite">
          <header className="chart-header">
            <div>
              <p className="chart-source">Satellite record · 1993–2023</p>
              <h3 id="active-chart-title">
                {isGlobal
                  ? "Regional mean and inter-country range"
                  : `${summary.country} annual anomaly`}
              </h3>
            </div>
            <p className="chart-note">
              {isGlobal
                ? "Line: equal-country mean. Band: lowest to highest country value each year."
                : "Annual values in millimeters; the series is not smoothed."}
            </p>
          </header>
          <LineChart
            id="active-chart"
            data={satellite}
            options={satelliteOptions}
          />
        </article>
      ) : hasHistorical ? (
        <article className="chart-card chart-card--historical">
          <header className="chart-header">
            <div>
              <p className="chart-source">Tide-gauge record · 1947–2025</p>
              <h3 id="active-chart-title">
                {isGlobal
                  ? "Regional mean with changing coverage"
                  : `${summary.country} station observations`}
              </h3>
            </div>
          </header>
          <LineChart
            id="active-chart"
            data={historical}
            options={historicalOptions}
          />
          <p className="chart-caption">
            {isGlobal
              ? "The regional mean changes composition over time. A year based on one country is not directly equivalent to a later year based on 12."
              : "Station coverage and baseline differ from the satellite record, so this line should not be treated as its earlier continuation."}
          </p>
        </article>
      ) : (
        <aside className="empty-state empty-state--dark">
          <p className="eyebrow">No tide-gauge series here</p>
          <h3>
            {`${summary.country} has no qualifying station record in this dataset.`}
          </h3>
          <p>
            The satellite record still covers this place from 1993 to 2023.
            Missing tide-gauge coverage does not mean sea level was unchanged.
          </p>
        </aside>
      )}
    </div>
  );
}
