import { SCROLL_PROGRESS } from "../constants";
import { usePinnedElementProgress } from "../hooks/useScrollProgress";
import type { SeaLevelData } from "../types";
import { CountryChangeChart } from "./CountryChangeChart";
import { RadialScrollChart } from "./RadialScrollChart";

interface ChartExperienceProps {
  data: SeaLevelData;
}

export function ChartExperience({ data }: ChartExperienceProps) {
  const {
    ref: radialRef,
    progress: radialProgress,
  } = usePinnedElementProgress<HTMLDivElement>({
    scrollContainerSelector: ".radial-story",
    targetSelector: ".radial-stage",
    travelScreens: SCROLL_PROGRESS.radialPinnedTravelScreens,
  });
  const { ref: countryRef, progress: countryProgress } =
    usePinnedElementProgress<HTMLDivElement>({
      targetSelector: ".country-section",
      lockBufferPx: 0,
    });

  return (
    <div className="chart-experience">
      <div ref={radialRef}>
        <RadialScrollChart
          data={data.regionalHistorical}
          progress={radialProgress}
        />
      </div>
      <div ref={countryRef} className="country-story">
        <CountryChangeChart
          data={data.summaries}
          progress={countryProgress}
        />
      </div>
    </div>
  );
}
