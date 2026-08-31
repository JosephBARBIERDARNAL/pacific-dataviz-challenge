import { useMemo } from "react";
import * as d3 from "d3";
import type { CountrySummary } from "../types";

interface CountryChangeChartProps {
  data: CountrySummary[];
}

const CHART_MAX_CM = 20;

function toCentimeters(millimeters: number): number {
  return millimeters / 10;
}

export function CountryChangeChart({ data }: CountryChangeChartProps) {
  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          d3.descending(a.rise, b.rise) || d3.ascending(a.country, b.country),
      ),
    [data],
  );
  const median = toCentimeters(d3.median(sorted, (datum) => datum.rise) ?? 0);
  const extent = (d3.extent(sorted, (datum) => datum.rise) as [number, number]).map(
    toCentimeters,
  );

  return (
    <section className="country-section" aria-labelledby="country-chart-heading">
      <div className="country-section-inner">
        <p className="section-kicker">Official Pacific Data Hub comparison</p>
        <h2 id="country-chart-heading">Every country in the dataset recorded a higher anomaly</h2>
        <p className="section-deck">
          Change between the 1993–1997 and 2019–2023 period means. Values are
          shown from a zero baseline and ordered from largest to smallest.
        </p>

        <div className="country-summary" aria-label="Comparison summary">
          <div><strong>{sorted.length}</strong><span>countries and territories</span></div>
          <div><strong>+{median} cm</strong><span>median increase</span></div>
          <div><strong>{extent[0]}–{extent[1]} cm</strong><span>observed range</span></div>
        </div>

        <div
          className="country-chart"
          role="list"
          aria-label="Sea-level anomaly increase by country and territory"
        >
          <div className="country-axis" aria-hidden="true">
            <span className="country-axis-scale">
              <span>0</span><span>10</span><span>20 cm</span>
            </span>
            <span />
          </div>
          {sorted.map((datum) => (
            <div
              className="country-row"
              key={datum.code}
              role="listitem"
              aria-label={`${datum.country}: +${toCentimeters(datum.rise)} centimetres`}
            >
              <span className="country-bar-track" aria-hidden="true">
                <span
                  className="country-bar"
                  style={{
                    width: `${Math.min(100, (toCentimeters(datum.rise) / CHART_MAX_CM) * 100)}%`,
                  }}
                />
              </span>
              <span className="country-value">+{toCentimeters(datum.rise)} cm</span>
            </div>
          ))}
        </div>

        <p className="chart-caption">
          Source: Pacific Data Hub, Sea level anomalies. Published annual
          values use 0.1 m increments; period-mean changes are shown in
          centimetres and reduce the influence of a single year.
        </p>
      </div>
    </section>
  );
}
