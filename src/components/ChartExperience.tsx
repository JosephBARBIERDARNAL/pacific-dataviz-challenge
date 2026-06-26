import { SCROLL_PROGRESS } from "../constants";
import { usePinnedElementProgress } from "../hooks/useScrollProgress";
import type { SeaLevelData } from "../types";
import { RadialScrollChart } from "./RadialScrollChart";
import { ScrollMetrics } from "./ScrollMetrics";

interface ChartExperienceProps {
  data: SeaLevelData;
}

export function ChartExperience({ data }: ChartExperienceProps) {
  const { ref, progress } = usePinnedElementProgress<HTMLDivElement>({
    scrollContainerSelector: ".radial-story",
    targetSelector: ".radial-chart",
    travelScreens: SCROLL_PROGRESS.radialPinnedTravelScreens,
  });

  return (
    <div ref={ref} className="chart-experience">
      <ScrollMetrics data={data} progress={progress} />
      <RadialScrollChart data={data.regionalHistorical} progress={progress} />
    </div>
  );
}
