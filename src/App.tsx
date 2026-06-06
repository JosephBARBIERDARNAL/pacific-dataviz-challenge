import { useEffect, useState } from "react";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HistoricalSection } from "./components/HistoricalSection";
import { ImpactsSection } from "./components/ImpactsSection";
import { ViewNavigation } from "./components/ViewNavigation";
import { ViewPanel } from "./components/ViewPanel";
import { prefersReducedMotion } from "./constants";
import { useSeaLevelData } from "./hooks/useSeaLevelData";
import { useView } from "./hooks/useView";
import { denseHistorical } from "./lib/denseHistorical";
import type { View } from "./types";

/**
 * Briefly fades the view panel while switching views (matching the
 * original 90ms "is-changing" animation), skipped under reduced motion.
 */
function useViewTransition(selectedView: View) {
  const [displayView, setDisplayView] = useState(selectedView);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (selectedView === displayView) return;
    if (prefersReducedMotion.matches) {
      setDisplayView(selectedView);
      return;
    }
    setIsChanging(true);
    const timer = window.setTimeout(() => {
      setDisplayView(selectedView);
      setIsChanging(false);
    }, 90);
    return () => window.clearTimeout(timer);
  }, [selectedView, displayView]);

  return { displayView, isChanging };
}

export default function App() {
  const { data, error } = useSeaLevelData();
  const { selectedView, selectView } = useView(data);
  const { displayView, isChanging } = useViewTransition(selectedView);

  const isGlobal = displayView === "global";
  const summary =
    data && !isGlobal ? (data.summaryByCountry.get(displayView) ?? null) : null;
  const satellite = data
    ? isGlobal
      ? data.regionalSatellite
      : (data.satelliteByCountry.get(displayView) ?? [])
    : [];
  const historical = data
    ? isGlobal
      ? data.regionalHistorical
      : denseHistorical(data.historicalByCountry.get(displayView))
    : [];

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to the story
      </a>

      <Header onSelect={selectView} />

      <main id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-intro">
            <p className="eyebrow">Water is rising</p>
            <h1 id="page-title">A changing shoreline across the Pacific</h1>
          </div>

          <ViewNavigation
            countries={data?.countries ?? []}
            selectedView={selectedView}
            onSelect={selectView}
          />

          {error && (
            <div id="load-error" className="load-error" role="alert">
              {error}
            </div>
          )}

          {!error &&
            (data ? (
              <ViewPanel
                data={data}
                summary={summary}
                satellite={satellite}
                isChanging={isChanging}
              />
            ) : (
              <div
                id="view-panel"
                className="view-panel"
                aria-labelledby="view-title"
                aria-live="polite"
              >
                <h2 id="view-title">Loading data…</h2>
              </div>
            ))}
        </section>

        {data && !error && (
          <HistoricalSection summary={summary} historical={historical} />
        )}

        <ImpactsSection />
      </main>

      <Footer />
    </>
  );
}
