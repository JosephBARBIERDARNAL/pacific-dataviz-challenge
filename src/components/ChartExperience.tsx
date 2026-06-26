import { usePinnedElementProgress } from "../hooks/useScrollProgress";
import type { SeaLevelData } from "../types";
import { RadialScrollChart } from "./RadialScrollChart";
import { ScrollMetrics } from "./ScrollMetrics";

interface ChartExperienceProps {
  data: SeaLevelData;
}

export function ChartExperience({ data }: ChartExperienceProps) {
  const { ref, progress } = usePinnedElementProgress<HTMLDivElement>({
    targetSelector: ".radial-chart",
    travelScreens: 1.25,
  });

  return (
    <div ref={ref} className="chart-experience">
      <ScrollMetrics data={data} progress={progress} />
      <RadialScrollChart data={data.regionalHistorical} progress={progress} />
    </div>
  );
}
