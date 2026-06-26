import { useMemo } from "react";
import * as d3 from "d3";
import { useScrollProgress } from "../hooks/useScrollProgress";
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
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function buildMetrics(data: SeaLevelData): Metric[] {
  const summaries = [...data.summaryByCountry.values()];

  return [
    {
      label: "Average 1993-2023 change",
      value: d3.mean(summaries, (d) => d.rise) ?? 0,
      format: (value) => `${formatSignedValue(value)} mm`,
    },
    {
      label: "People directly affected, 2005-2023",
      value: d3.sum(summaries, (d) => d.affected),
      format: formatCompact,
    },
    {
      label: "Reported disaster losses, 2007-2020",
      value: d3.sum(summaries, (d) => d.losses),
      format: formatCurrency,
    },
  ];
}

export function ScrollMetrics({ data }: ScrollMetricsProps) {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const metrics = useMemo(() => buildMetrics(data), [data]);
  const animatedProgress = easeOutCubic(progress);

  return (
    <section ref={ref} className="metrics-section" aria-label="Key figures">
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
