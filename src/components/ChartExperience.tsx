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
    targetSelector: ".radial-chart",
    travelScreens: SCROLL_PROGRESS.radialPinnedTravelScreens,
  });

  return (
    <div className="chart-experience">
      <CountryChangeChart data={data.summaries} />
      <div ref={ref}>
        <RadialScrollChart data={data.regionalHistorical} progress={progress} />
      </div>
      <section className="story-conclusion" aria-labelledby="conclusion-heading">
        <div className="story-conclusion-inner">
          <p className="section-kicker">What the record can—and cannot—say</p>
          <h2 id="conclusion-heading">A shared direction, measured through an uneven network</h2>
          <p>
            The recent increase appears across every country and territory in
            the official comparison. The longer tide-gauge series is consistent
            with the same broad direction, but its changing mix of locations
            means it should be read as historical context—not as a precise,
            like-for-like index for the entire Pacific.
          </p>
          <p>
            Disaster impacts are intentionally not combined with this chart.
            The available disaster records cover different periods and event
            types, and do not establish that sea-level rise caused a reported
            loss or affected-person count.
          </p>
        </div>
      </section>
    </div>
  );
}
