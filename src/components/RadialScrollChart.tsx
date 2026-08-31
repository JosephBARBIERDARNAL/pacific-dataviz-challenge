import { useEffect, useRef } from "react";
import { RECORD_RANGES, RESIZE_OBSERVER } from "../constants";
import { drawRadialChart, type RadialChartHandle } from "../lib/radialChart";
import type { ChartPoint } from "../types";

interface RadialScrollChartProps {
  data: ChartPoint[];
  progress: number;
}

export function RadialScrollChart({ data, progress }: RadialScrollChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RadialChartHandle | null>(null);
  const progressRef = useRef(progress);
  const maximumCountryCount = Math.max(
    ...data.map((datum) => datum.count ?? 0),
    1,
  );

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const container = chartRef.current;
    if (!container || data.length === 0) return;

    const draw = () => {
      handleRef.current?.cleanup();
      handleRef.current = drawRadialChart(container, data);
      handleRef.current.update(progressRef.current);
    };

    draw();
    let previousWidth =
      Math.round(container.clientWidth / RESIZE_OBSERVER.widthPrecision) *
      RESIZE_OBSERVER.widthPrecision;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width =
          Math.round(entry.contentRect.width / RESIZE_OBSERVER.widthPrecision) *
          RESIZE_OBSERVER.widthPrecision;
        if (width === previousWidth) continue;
        previousWidth = width;
        draw();
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      handleRef.current?.cleanup();
      handleRef.current = null;
    };
  }, [data]);

  useEffect(() => {
    handleRef.current?.update(progress);
  }, [progress]);

  return (
    <>
      <section
        className="radial-story"
        aria-labelledby="radial-chart-heading"
        aria-describedby="radial-chart-note"
      >
        <div className="radial-copy">
          <p className="chart-source">
            Selected tide-gauge context · {RECORD_RANGES.historical.hyphenLabel}
          </p>
          <h2 id="radial-chart-heading">
            The long record rises—but its coverage keeps changing
          </h2>
          <p id="radial-chart-note" className="chart-note">
            The colored line comes from a curated, non-exhaustive set of tide
            gauges and is an unweighted mean of the available country records,
            smoothed with a centered five-year window. Its distance from the
            dashed line shows the anomaly relative to each station&apos;s
            1993–2000 baseline.
          </p>
          <p className="chart-note">
            The contributing locations are not constant, so this is historical
            context rather than a like-for-like regional index. The story ends
            in 2023; the available 2024–2025 observations are excluded because
            their coverage drops sharply.
          </p>
          <div className="radial-legend" aria-label="Chart key">
            <span>
              <i className="legend-swatch legend-line" aria-hidden="true" />
              Five-year mean
            </span>
            <span>
              <i className="legend-swatch legend-baseline" aria-hidden="true" />
              Zero anomaly
            </span>
            <span>
              Center readout also shows the annual mean and that year&apos;s
              coverage
            </span>
            <span>A 100 mm key shows the radial offset scale</span>
          </div>
          <div className="coverage-panel" aria-labelledby="coverage-heading">
            <div className="coverage-heading-row">
              <h3 id="coverage-heading">Countries contributing each year</h3>
              <span>1–{maximumCountryCount} of 12 represented countries</span>
            </div>
            <div
              className="coverage-bars"
              role="list"
              aria-label="Annual tide-gauge coverage"
            >
              {data.map((datum) => {
                const countryCount = datum.count ?? 0;
                const stationCount = datum.stationCount ?? 0;
                const countryLabel = countryCount === 1 ? "country" : "countries";
                const stationLabel = stationCount === 1 ? "station" : "stations";

                return (
                  <span
                    key={datum.year}
                    className="coverage-bar"
                    role="listitem"
                    tabIndex={0}
                    aria-label={`${datum.year}: ${countryCount} ${countryLabel}, ${stationCount} ${stationLabel}`}
                    style={{
                      height: `${(countryCount / maximumCountryCount) * 100}%`,
                    }}
                  >
                    <span className="coverage-tooltip" role="tooltip">
                      <strong>{datum.year}</strong>
                      <span>
                        {countryCount} {countryLabel}
                      </span>
                      <span>
                        {stationCount} {stationLabel}
                      </span>
                    </span>
                  </span>
                );
              })}
            </div>
            <div className="coverage-years" aria-hidden="true">
              <span>{data[0]?.year}</span>
              <span>1985</span>
              <span>{data.at(-1)?.year}</span>
            </div>
          </div>
        </div>
        <div
          id="radial-sea-level-chart"
          className="radial-chart"
          ref={chartRef}
        />
      </section>
    </>
  );
}
