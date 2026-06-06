import * as d3 from "d3";
import {
  formatCompact,
  formatCurrency,
  formatPercent,
  reportedCurrency,
  reportedNumber,
} from "../lib/format";
import type { CountrySummary, SeaLevelData } from "../types";

interface ContextMetric {
  label: string;
  value: string;
  period: string;
}

interface ContextSectionProps {
  data: SeaLevelData;
  summary: CountrySummary | null;
}

export function ContextSection({ data, summary }: ContextSectionProps) {
  const allSummaries = [...data.summaryByCountry.values()];
  const values: ContextMetric[] = summary
    ? [
        {
          label: "People directly affected",
          value: reportedNumber(summary.affected),
          period: "cumulative reported total, 2005–2023",
        },
        {
          label: "Reported disaster losses",
          value: reportedCurrency(summary.losses),
          period: "cumulative reported total, 2007–2020",
        },
        {
          label: "Average population growth",
          value: `${formatPercent(summary.populationGrowth)}%`,
          period: "annual average, 2020–2025",
        },
      ]
    : [
        {
          label: "People directly affected",
          value: formatCompact(d3.sum(allSummaries, (d) => d.affected)),
          period: "sum of reported country totals, 2005–2023",
        },
        {
          label: "Reported disaster losses",
          value: formatCurrency(d3.sum(allSummaries, (d) => d.losses)),
          period: "sum of reported country totals, 2007–2020",
        },
        {
          label: "Places with affected-person data",
          value: `${allSummaries.filter((d) => d.affected > 0).length} / ${allSummaries.length}`,
          period: "positive reported values in the source",
        },
      ];

  return (
    <section
      id="context-section"
      className="context-section"
      aria-labelledby="context-title"
    >
      <div className="section-heading">
        <div>
          <p className="eyebrow">Reported exposure</p>
          <h2 id="context-title">Sea level meets people and infrastructure</h2>
        </div>
        <p id="context-intro" className="section-intro">
          {summary
            ? `Available contextual indicators for ${summary.country}. These totals cover all reported disasters, not only coastal events.`
            : "Regional sums provide scale, but reporting coverage varies and the values include all recorded disasters, not only coastal events."}
        </p>
      </div>
      <div id="context-metrics" className="context-metrics">
        {values.map((metric) => (
          <div className="context-metric" key={metric.label}>
            <span className="context-label">{metric.label}</span>
            <span className="context-value">{metric.value}</span>
            <span className="context-period">{metric.period}</span>
          </div>
        ))}
      </div>
      <p className="data-caveat">
        Disaster totals are reported source values, not a complete accounting
        of sea-level impacts. A zero is shown as “not reported” because it may
        reflect missing coverage rather than no impact.
      </p>
    </section>
  );
}
