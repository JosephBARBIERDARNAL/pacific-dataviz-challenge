import { Footer } from "./components/Footer";
import { RadialScrollChart } from "./components/RadialScrollChart";
import { ScrollMetrics } from "./components/ScrollMetrics";
import { useSeaLevelData } from "./hooks/useSeaLevelData";

function MethodSection() {
  return (
    <section className="method-section" aria-labelledby="method-title">
      <div className="method-inner">
        <p className="eyebrow eyebrow--dark">Method and data</p>
        <h2 id="method-title">What this story measures</h2>
        <div className="method-grid">
          <p>
            The chart shows annual sea-level anomaly in millimeters for the
            Pacific region, built from tide-gauge observations. Each station is
            measured relative to its own 1993-2000 baseline before the regional
            series is assembled.
          </p>
          <p>
            The visible line is smoothed with a centered five-year average to
            make the long-term direction easier to read. The source data remain
            annual observations, and the number of contributing countries and
            stations changes through time.
          </p>
          <p>
            The top figures summarize the 21 Pacific countries and territories
            in the project data. Disaster totals include all recorded disasters,
            not only coastal events, so they provide context rather than a
            direct attribution to sea-level rise.
          </p>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const { data, error } = useSeaLevelData();

  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to the story
      </a>

      <main id="main-content">
        <section className="hero" aria-labelledby="page-title">
          <div className="hero-intro">
            <h1 id="page-title">A changing shoreline across the Pacific</h1>
          </div>
        </section>

        {error && (
          <div id="load-error" className="load-error" role="alert">
            {error}
          </div>
        )}

        {!error &&
          (data ? (
            <>
              <ScrollMetrics data={data} />
              <RadialScrollChart data={data.regionalHistorical} />
              <MethodSection />
            </>
          ) : (
            <section className="loading-panel" aria-live="polite">
              <h2>Loading data...</h2>
            </section>
          ))}
      </main>

      <Footer />
    </>
  );
}
