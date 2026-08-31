import { ASSET_PATHS } from "../constants";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <p className="footer-label">Materials and references</p>
          <p>
            Code, method and data:{" "}
            <a
              href="https://github.com/JosephBARBIERDARNAL/pacific-dataviz-challenge"
              target="_blank"
              rel="noreferrer"
            >
              Github
            </a>
          </p>
          <p>
            Official data:{" "}
            <a
              href="https://stats-nsi-stable.pacificdata.org/rest/data/SPC,DF_CLIMATE_CHANGE,1.0/A.SEA_LVL./all?dimensionAtObservation=AllDimensions&amp;detail=full&amp;format=csvfile"
              target="_blank"
              rel="noreferrer"
            >
              Pacific Data Hub sea-level anomalies
            </a>{" "}
          </p>
          <p>
            Historical context:{" "}
            <a
              href="https://psmsl.org/data/obtaining/"
              target="_blank"
              rel="noreferrer"
            >
              Permanent Service for Mean Sea Level (PSMSL), Tide Gauge Data
            </a>{" "}
            (Revised Local Reference annual data; access and method are in the
            data notes.)
          </p>
          <p>
            Author:{" "}
            <a
              href="https://barbierjoseph.com/"
              target="_blank"
              rel="noreferrer"
            >
              Joseph Barbier
            </a>
          </p>
        </div>
        <a
          href="https://pacificdatavizchallenge.org/"
          target="_blank"
          rel="noreferrer"
        >
          <img
            className="footer-logo"
            src={ASSET_PATHS.logo}
            alt="Pacific Dataviz Challenge"
          />
        </a>
      </div>
    </footer>
  );
}
