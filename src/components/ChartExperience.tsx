import { SCROLL_PROGRESS } from "../constants";
import { usePinnedElementProgress } from "../hooks/useScrollProgress";
import type { SeaLevelData } from "../types";
import { CountryChangeChart } from "./CountryChangeChart";
import { RadialScrollChart } from "./RadialScrollChart";

interface ChartExperienceProps {
  data: SeaLevelData;
}

export function ChartExperience({ data }: ChartExperienceProps) {
  const { ref, progress } = usePinnedElementProgress<HTMLDivElement>({
    scrollContainerSelector: ".radial-story",
    targetSelector: ".radial-stage",
    travelScreens: SCROLL_PROGRESS.radialPinnedTravelScreens,
  });

  return (
    <div className="chart-experience">
      <div ref={ref}>
        <RadialScrollChart data={data.regionalHistorical} progress={progress} />
      </div>
      <CountryChangeChart data={data.summaries} />
    </div>
  );
}
