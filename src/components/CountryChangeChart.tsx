import { useMemo } from "react";
import * as d3 from "d3";
import type { CountrySummary } from "../types";

interface CountryChangeChartProps {
  data: CountrySummary[];
  progress: number;
}

const CHART_MAX_CM = 18;

function toCentimeters(millimeters: number): number {
  return millimeters / 10;
}

export function CountryChangeChart({
  data,
  progress,
}: CountryChangeChartProps) {
  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          d3.descending(a.rise, b.rise) || d3.ascending(a.country, b.country),
      ),
    [data],
  );
  const median = toCentimeters(d3.median(sorted, (datum) => datum.rise) ?? 0);
  const extent = (
    d3.extent(sorted, (datum) => datum.rise) as [number, number]
  ).map(toCentimeters);

  return (
    <section
      className="country-section"
      aria-labelledby="country-chart-heading"
    >
      <div className="country-section-inner">
        <h2 id="country-chart-heading">
          <span className="text-highlight">Every country</span> recorded a
          higher anomaly
        </h2>

        <div className="country-summary" aria-label="Comparison summary">
          <div>
            <strong>{sorted.length}</strong>
            <span>countries and territories</span>
          </div>
          <div>
            <strong>+{median} cm</strong>
            <span>median increase</span>
          </div>
          <div>
            <strong>
              {extent[0]}–{extent[1]} cm
            </strong>
            <span>observed range</span>
          </div>
        </div>

        <p className="section-deck">
          Difference between the 1993–1997 and 2019–2023 period means.
        </p>
        <div
          className="country-chart"
          role="list"
          aria-label="Sea-level anomaly increase by country and territory"
        >
          {sorted.map((datum, index) => {
            const actualCentimeters = toCentimeters(datum.rise);
            const currentCentimeters = Math.min(
              actualCentimeters,
              CHART_MAX_CM * progress,
            );

            return (
              <div
                className="country-row"
                key={datum.code}
                role="listitem"
                aria-label={`${datum.country}: +${actualCentimeters} centimetres`}
              >
                <span className="country-name">{datum.country}</span>
                <span className="country-bar-track" aria-hidden="true">
                  <span
                    className={`country-bar${index === 0 ? " country-bar-highlight" : ""}`}
                    style={{
                      width: `${(currentCentimeters / CHART_MAX_CM) * 100}%`,
                    }}
                  >
                    <span
                      style={{ opacity: progress === 0 ? 0 : 1 }}
                      className={`${index === 0 ? "country-value country-value-white" : "country-value"}`}
                    >
                      +{Number(currentCentimeters.toFixed(1))} cm
                    </span>
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
