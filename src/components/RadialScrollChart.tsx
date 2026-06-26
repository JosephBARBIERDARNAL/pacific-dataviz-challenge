import { useEffect, useRef } from "react";
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
    let previousWidth = Math.round(container.clientWidth);
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = Math.round(entry.contentRect.width);
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
    <section className="radial-story" aria-label="Tide-gauge record, 1947-2025">
      <div className="radial-copy">
        <p className="chart-source">Tide-gauge record · 1947-2025</p>
      </div>
      <div id="radial-sea-level-chart" className="radial-chart" ref={chartRef} />
    </section>
  );
}
