import { useEffect, useRef } from "react";
import { RECORD_RANGES, RESIZE_OBSERVER } from "../constants";
import { drawRadialChart, type RadialChartHandle } from "../lib/radialChart";
import type { ChartPoint } from "../types";
import { HistoricalTrendChart } from "./HistoricalTrendChart";

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
        <div
          id="radial-sea-level-chart"
          className="radial-chart"
          ref={chartRef}
        />
      </section>
      <section className="radial-context" aria-labelledby="radial-chart-heading">
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
            smoothed with an up-to-five-year centered window. Its distance from
            the dashed line shows the anomaly relative to each station&apos;s
            1993–2000 baseline.
          </p>
          <p className="chart-note">
            The contributing locations are not constant, so this is historical
            context rather than a like-for-like regional index. It includes the
            latest available 2025 observations; inspect the coverage before
            comparing any two years.
          </p>
          <div className="radial-legend" aria-label="Chart key">
            <span>
              <i className="legend-swatch legend-line" aria-hidden="true" />
              Up-to-five-year mean
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
            </div>
            <div
              className="coverage-bars"
              role="list"
              aria-label="Annual tide-gauge coverage"
            >
              {data.map((datum) => {
                const countryCount = datum.count ?? 0;
                const stationCount = datum.stationCount ?? 0;
                const countryLabel =
                  countryCount === 1 ? "country" : "countries";
                const stationLabel =
                  stationCount === 1 ? "station" : "stations";

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
          <HistoricalTrendChart data={data} />
          <br />
          <details className="data-notes">
            <summary>Methods, sources, and data downloads</summary>
            <div className="data-notes-content">
              <p>
                The country comparison uses Pacific Data Hub annual sea-level
                anomalies. It compares the 1993–1997 and 2019–2023 period means
                for all 21 covered countries and territories.
              </p>
              <p>
                Historical context uses Permanent Service for Mean Sea Level
                (PSMSL) Revised Local Reference annual data: 28 candidate
                stations in 12 countries and territories, of which 23 meet the
                baseline rule. Each station is expressed relative to its
                available 1993–2000 mean; stations are averaged within a
                country, then countries are averaged without weighting. The
                candidate station IDs are 539, 540, 528, 1370, 1925, 513, 1217,
                1838, 1254, 1303, 1607, 1608, 1609, 1610, 1860, 1739, 1804,
                1452, 1839, 1373, 1861, 1841, 1327, 1805, 2356, 1397, 2242, and
                1843.
              </p>
              <p>
                The full method and provenance are documented in the project
                repository and the downloadable provenance record.
              </p>
              <p className="data-links">
                <a href={`${import.meta.env.BASE_URL}data/country_summary.csv`}>
                  Download country comparison CSV
                </a>
                <a
                  href={`${import.meta.env.BASE_URL}data/sea_level_historical.csv`}
                >
                  Download historical context CSV
                </a>
                <a
                  href={`${import.meta.env.BASE_URL}data/historical_station_coverage.csv`}
                >
                  Download annual station coverage CSV
                </a>
                <a href={`${import.meta.env.BASE_URL}data/provenance.json`}>
                  Download provenance record
                </a>
                <a
                  href="https://stats-nsi-stable.pacificdata.org/rest/data/SPC,DF_CLIMATE_CHANGE,1.0/A.SEA_LVL./all?dimensionAtObservation=AllDimensions&amp;detail=full&amp;format=csvfile"
                  target="_blank"
                  rel="noreferrer"
                >
                  Pacific Data Hub source
                </a>
                <a
                  href="https://psmsl.org/data/obtaining/reference.php"
                  target="_blank"
                  rel="noreferrer"
                >
                  PSMSL citation guidance
                </a>
              </p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
