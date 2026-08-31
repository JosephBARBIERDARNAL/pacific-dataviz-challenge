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
    <section
      className="radial-story"
      aria-labelledby="radial-chart-heading"
      aria-describedby="radial-chart-note"
    >
      <div className="radial-copy">
        <p className="chart-source">
          Selected tide-gauge record · {RECORD_RANGES.historical.hyphenLabel}
        </p>
        <h2 id="radial-chart-heading">The tide-gauge record spirals forward</h2>
        <p id="radial-chart-note" className="chart-note">
          Time advances around the spiral. The colored line shows a centered
          five-year mean anomaly in millimeters; its distance from the dashed
          spiral is measured relative to each station&apos;s 1993-2000 baseline.
          The dashed spiral is the zero-anomaly reference, not a second series.
        </p>
        <p className="chart-note">
          Coverage varies from 1-12 countries and 1-19 stations per year.
          Read the live coverage below the year before comparing periods; 2025
          includes only two countries.
        </p>
        <div className="radial-legend" aria-label="Chart key">
          <span>
            <i className="legend-swatch legend-line" aria-hidden="true" />
            Smoothed anomaly
          </span>
          <span>
            <i className="legend-swatch legend-baseline" aria-hidden="true" />
            Zero anomaly / time
          </span>
          <span>Radial offset is linearly scaled in millimeters</span>
        </div>
      </div>
      <div
        id="radial-sea-level-chart"
        className="radial-chart"
        ref={chartRef}
      />
    </section>
  );
}
