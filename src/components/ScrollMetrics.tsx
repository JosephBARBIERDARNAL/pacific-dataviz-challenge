import { useMemo } from "react";
import * as d3 from "d3";
import { RECORD_RANGES } from "../constants";
import {
  formatCompact,
  formatCurrency,
  formatSignedValue,
} from "../lib/format";
import type { SeaLevelData } from "../types";

interface Metric {
  label: string;
  detail?: string;
  value: number;
  format: (value: number) => string;
}

interface ScrollMetricsProps {
  data: SeaLevelData;
  progress: number;
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function buildMetrics(data: SeaLevelData): Metric[] {
  const riseValues = data.summaries
    .map((summary) => summary.rise)
    .filter((value) => Number.isFinite(value));
  const medianRise = d3.median(riseValues) ?? 0;
  const minimumRise = d3.min(riseValues) ?? 0;
  const maximumRise = d3.max(riseValues) ?? 0;

  return [
    {
      label: `Typical country change, ${RECORD_RANGES.satellite.hyphenLabel}`,
      detail: `Median of ${riseValues.length} countries · range ${minimumRise}-${maximumRise} mm`,
      value: medianRise,
      format: (value) => `${formatSignedValue(value)} mm`,
    },
    {
      label: `People recorded as affected by disasters, ${RECORD_RANGES.affected.hyphenLabel}`,
      detail: "All reported disaster types; not attributed to sea-level rise",
      value: d3.sum(data.summaries, (d) => d.affected),
      format: formatCompact,
    },
    {
      label: `Reported disaster losses, ${RECORD_RANGES.losses.hyphenLabel}`,
      detail: "All reported disaster types; not attributed to sea-level rise",
      value: d3.sum(data.summaries, (d) => d.losses),
      format: formatCurrency,
    },
  ];
}

export function ScrollMetrics({ data, progress }: ScrollMetricsProps) {
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const animatedProgress = easeOutCubic(progress);

  return (
    <section className="metrics-section" aria-label="Key figures">
      <div className="metrics">
        {metrics.map((metric) => {
          const value = metric.value * animatedProgress;
          return (
            <div className="metric" key={metric.label}>
              <span className="metric-value">{metric.format(value)}</span>
              <span className="metric-label">{metric.label}</span>
              {metric.detail && <span className="metric-detail">{metric.detail}</span>}
            </div>
          );
        })}
      </div>
    </section>
  );
}
