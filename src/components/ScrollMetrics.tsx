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
  return [
    {
      label: `Average ${RECORD_RANGES.satellite.hyphenLabel} change`,
      value: d3.mean(data.summaries, (d) => d.rise) ?? 0,
      format: (value) => `${formatSignedValue(value)} mm`,
    },
    {
      label: `People directly affected, ${RECORD_RANGES.affected.hyphenLabel}`,
      value: d3.sum(data.summaries, (d) => d.affected),
      format: formatCompact,
    },
    {
      label: `Reported disaster losses, ${RECORD_RANGES.losses.hyphenLabel}`,
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
            </div>
          );
        })}
      </div>
    </section>
  );
}
