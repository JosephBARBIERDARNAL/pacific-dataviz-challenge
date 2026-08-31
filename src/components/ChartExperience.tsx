import { SCROLL_PROGRESS } from "../constants";
import { usePinnedElementProgress } from "../hooks/useScrollProgress";
import type { SeaLevelData } from "../types";
import { CountryChangeChart } from "./CountryChangeChart";
import { RadialScrollChart } from "./RadialScrollChart";
import { StoryConclusion } from "./StoryConclusion";

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
    <div className="chart-experience">
      <CountryChangeChart data={data.summaries} />
      <div ref={ref}>
        <RadialScrollChart data={data.regionalHistorical} progress={progress} />
      </div>
      <StoryConclusion />
    </div>
  );
}
