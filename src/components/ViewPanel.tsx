import * as d3 from "d3";
import { useMemo } from "react";
import { COLORS, DATA_COVERAGE, RECORD_RANGES } from "../constants";
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

function buildMetrics(
  data: SeaLevelData,
  summary: CountrySummary | null,
): Metric[] {
  if (summary) {
    return [
      {
        label: "sea level change",
        value: `${formatSignedValue(summary.rise)} mm`,
      },
      {
        label: "People directly affected (cumulative)",
        value: reportedNumber(summary.affected),
      },
      {
        label: "Reported disaster losses (cumulative)",
        value: reportedCurrency(summary.losses),
      },
    ];
  }

  const allSummaries = [...data.summaryByCountry.values()];
  return [
    {
      label: `Average ${RECORD_RANGES.satellite.label} change`,
      value: `${formatSignedValue(d3.mean(allSummaries, (d) => d.rise)!)} mm`,
    },
    {
      label: `People directly affected, ${RECORD_RANGES.affected.label}`,
      value: formatCompact(d3.sum(allSummaries, (d) => d.affected)),
    },
    {
      label: `Reported disaster losses, ${RECORD_RANGES.losses.label}`,
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

  const satelliteOptions = useMemo<LineChartOptions>(
    () => ({
      theme: "dark",
      color: COLORS.satellite,
      title: isGlobal
        ? `Pacific regional satellite-era sea-level anomaly, ${RECORD_RANGES.satellite.start} to ${RECORD_RANGES.satellite.end}`
        : `${summary.country} satellite-era sea-level anomaly, ${RECORD_RANGES.satellite.start} to ${RECORD_RANGES.satellite.end}`,
      description: isGlobal
        ? `A line shows the annual equal-country mean and a band shows the range across ${DATA_COVERAGE.satellitePlaces} countries.`
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
        <p className="measure-description">
          {showingSatellite
            ? isGlobal
              ? `A consistent ${RECORD_RANGES.satellite.label} record across ${DATA_COVERAGE.satellitePlaces} places. The line is the equal-country annual mean; the shaded band shows the full range between countries.`
              : `A consistent annual record for ${summary.country} from ${RECORD_RANGES.satellite.start} to ${RECORD_RANGES.satellite.end}. Values are sea-level differences from the dataset’s reference level, measured in millimeters.`
            : isGlobal
              ? `A longer but selective station record from ${RECORD_RANGES.historical.start} to ${RECORD_RANGES.historical.end}. Each station is measured relative to its own ${RECORD_RANGES.satelliteBaseline.label} mean, and the number of contributing countries changes over time.`
              : `Available station observations for ${summary.country}, measured relative to each station’s ${RECORD_RANGES.satelliteBaseline.label} mean. Missing years are left as gaps rather than estimated.`}
        </p>
        <p className="record-comparison">
          Satellite data are consistent across all{" "}
          {DATA_COVERAGE.satellitePlaces} places; tide gauges reach further
          back but cover only {DATA_COVERAGE.historicalPlaces} places and vary
          by station and year. The two records should be compared, not joined
          into one line.
        </p>
      </section>

      <div id="metrics" className="metrics" aria-label="Key sea-level figures">
        {metrics.map((metric) => (
          <div className="metric" key={metric.label}>
            <span className="metric-value">{metric.value}</span>
            <span className="metric-label">{metric.label}</span>
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
              <p className="chart-source">
                Satellite record · {RECORD_RANGES.satellite.label}
              </p>
              <h3 id="active-chart-title">
                {isGlobal
                  ? "Regional mean and inter-country range"
                  : `${summary.country} annual anomaly`}
              </h3>
            </div>
            <p className="chart-note">
              {isGlobal
                ? "Line: equal-country mean. Band: lowest to highest country value each year."
                : "Annual satellite measurements in millimeters."}
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
              <p className="chart-source">
                Tide-gauge record · {RECORD_RANGES.historical.label}
              </p>
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
              ? `The regional mean changes composition over time. A year based on one country is not directly equivalent to a later year based on ${DATA_COVERAGE.historicalPlaces}.`
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
            The satellite record still covers this place from{" "}
            {RECORD_RANGES.satellite.start} to {RECORD_RANGES.satellite.end}.
            Missing tide-gauge coverage does not mean sea level was unchanged.
          </p>
        </aside>
      )}
    </div>
  );
}
