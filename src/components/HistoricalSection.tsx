import { useMemo } from "react";
import { COLORS } from "../constants";
import { formatSignedValue } from "../lib/format";
import type { LineChartOptions } from "../lib/lineChart";
import type { ChartPoint, CountrySummary } from "../types";
import { LineChart } from "./LineChart";

interface HistoricalSectionProps {
  summary: CountrySummary | null;
  historical: ChartPoint[];
}

export function HistoricalSection({
  summary,
  historical,
}: HistoricalSectionProps) {
  const isGlobal = !summary;
  const validData = historical.filter((d) => d.value != null);
  const hasHistorical = isGlobal || validData.length > 0;

  const chartOptions = useMemo<LineChartOptions>(
    () => ({
      theme: "light",
      color: COLORS.historical,
      title: isGlobal
        ? "Pacific regional historical tide-gauge anomaly with country contributor counts"
        : `${summary.country} historical tide-gauge anomaly`,
      description: isGlobal
        ? "A line shows the annual equal-country tide-gauge mean. A strip shows contributor counts, which vary through time."
        : `A line shows available annual tide-gauge anomalies for ${summary.country}; missing years create gaps.`,
      countStrip: isGlobal,
      directLabel: isGlobal ? "Historical mean" : summary.country,
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

  return (
    <section className="evidence-section" aria-labelledby="historical-section-title">
      <div>
        <p className="eyebrow eyebrow--dark">The longer, narrower record</p>
        <h2 id="historical-section-title">What tide gauges saw</h2>
        {!hasHistorical && (
          <p id="historical-intro" className="section-intro">
            Historical coverage is selective. Some country views therefore
            retain only the complete satellite-era panel.
          </p>
        )}
      </div>

      {hasHistorical ? (
        <article id="historical-card" className="chart-card chart-card--historical">
          <header className="chart-header">
            <h3 id="historical-title">
              {isGlobal
                ? "Regional tide-gauge mean and changing coverage"
                : `${summary.country} tide-gauge anomaly`}
            </h3>
            <p id="historical-note" className="chart-note">
              {isGlobal
                ? "The strip below the line reports how many country series contribute in each year."
                : "Relative to the contributing station records’ 1993–2000 mean; no interpolation across missing years."}
            </p>
          </header>
          <LineChart
            id="historical-chart"
            data={historical}
            options={chartOptions}
          />
          <p id="historical-caption" className="chart-caption">
            {isGlobal
              ? "A mean based on one country in 1947 is not directly equivalent to a mean based on 12 countries later. The contributor strip makes that changing composition visible."
              : "This tide-gauge line is separate from the satellite-era line above. Their baselines and spatial coverage differ, so they should not be spliced into one continuous series."}
          </p>
        </article>
      ) : (
        <aside id="historical-empty" className="empty-state">
          <p className="eyebrow eyebrow--dark">No historical series here</p>
          <h3 id="historical-empty-title">
            {`${summary.country} has no qualifying tide-gauge series in these data.`}
          </h3>
          <p>
            The comparable satellite record still covers this view from 1993 to
            2023. Absence from the tide-gauge panel means this dataset has no
            qualifying historical country series; it does not mean the sea was
            unchanged.
          </p>
        </aside>
      )}
    </section>
  );
}
