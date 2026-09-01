import { useEffect, useRef } from "react";
import { RECORD_RANGES, RESIZE_OBSERVER } from "../constants";
import { drawRadialChart, type RadialChartHandle } from "../lib/radialChart";
import type { ChartPoint } from "../types";
import { HistoricalTrendChart } from "./HistoricalTrendChart";

interface ImpactTextSegment {
  text: string;
  highlight?: boolean;
}

const IMPACT_TEXT_SEGMENTS: readonly ImpactTextSegment[] = [
  {
    text: "Sea level rise increases coastal flooding and storm-surge damage. It can affect ",
  },
  { text: "freshwater and farmland", highlight: true },
  {
    text: ", disrupt transport and essential services, and raise costs for households and governments. Investment in drainage, coastal protection, and warning systems can ",
  },
  { text: "reduce losses", highlight: true },
  { text: " and protect livelihoods." },
];

const IMPACT_TEXT_LENGTH = IMPACT_TEXT_SEGMENTS.reduce(
  (length, segment) => length + segment.text.length,
  0,
);

function getVisibleImpactText(visibleLength: number) {
  let remainingLength = visibleLength;

  return IMPACT_TEXT_SEGMENTS.flatMap((segment) => {
    const text = segment.text.slice(0, remainingLength);
    remainingLength -= text.length;
    return text ? [{ ...segment, text }] : [];
  });
}

interface RadialScrollChartProps {
  data: ChartPoint[];
  progress: number;
}

export function RadialScrollChart({ data, progress }: RadialScrollChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RadialChartHandle | null>(null);
  const progressRef = useRef(progress);
  const visibleImpactTextLength = Math.round(IMPACT_TEXT_LENGTH * progress);
  const visibleImpactText = getVisibleImpactText(visibleImpactTextLength);

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
        <div className="radial-stage">
          <div
            id="radial-sea-level-chart"
            className="radial-chart"
            ref={chartRef}
          />
          <aside className="radial-impact">
            <h2>When the water rises</h2>
            <p>
              {visibleImpactText.map((segment, index) => (
                <span
                  className={segment.highlight ? "text-highlight" : undefined}
                  key={index}
                >
                  {segment.text}
                </span>
              ))}
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
