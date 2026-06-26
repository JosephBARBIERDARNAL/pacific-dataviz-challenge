import { useEffect, useRef } from "react";
import { RESIZE_OBSERVER } from "../constants";
import { drawLineChart, type LineChartOptions } from "../lib/lineChart";
import type { ChartPoint } from "../types";

interface LineChartProps {
  id: string;
  data: ChartPoint[];
  options: LineChartOptions;
}

export function LineChart({ id, data, options }: LineChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let cleanup = drawLineChart(container, data, options);
    let previousWidth =
      Math.round(container.clientWidth / RESIZE_OBSERVER.widthPrecision) *
      RESIZE_OBSERVER.widthPrecision;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const observedWidth =
          Math.round(entry.contentRect.width / RESIZE_OBSERVER.widthPrecision) *
          RESIZE_OBSERVER.widthPrecision;
        if (observedWidth === previousWidth) continue;
        previousWidth = observedWidth;
        cleanup();
        cleanup = drawLineChart(container, data, options);
      }
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      cleanup();
    };
  }, [data, options]);

  return <div id={id} className="chart" ref={containerRef} />;
}
