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
