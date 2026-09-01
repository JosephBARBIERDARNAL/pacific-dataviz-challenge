import { ChartExperience } from "./components/ChartExperience";
import { Footer } from "./components/Footer";
import { useSeaLevelData } from "./hooks/useSeaLevelData";

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
            <p className="hero-kicker">Pacific sea-level change</p>
            <h1 id="page-title">
              The rise is <span className="text-highlight">widespread</span>. The long record is uneven.
            </h1>
            <p className="hero-deck">
              Across 21 Pacific countries and territories, the 2019–2023
              sea-level anomaly was 8–18 cm higher than in 1993–1997. The median
              increase was <span className="text-highlight">10 cm</span>.
            </p>
          </div>
        </section>

        {error && (
          <div id="load-error" className="load-error" role="alert">
            {error}
          </div>
        )}

        {!error &&
          (data ? (
            <ChartExperience data={data} />
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
