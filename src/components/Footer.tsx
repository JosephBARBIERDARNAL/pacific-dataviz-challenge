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
              PSMSL Revised Local Reference annual data
            </a>
          </p>
          <p>
            Terms and citation:{" "}
            <a
              href="https://pacificdata.org/terms-use"
              target="_blank"
              rel="noreferrer"
            >
              Pacific Data Hub
            </a>{" "}
            and{" "}
            <a
              href="https://psmsl.org/data/obtaining/reference.php"
              target="_blank"
              rel="noreferrer"
            >
              PSMSL referencing guidance
            </a>
            . Pacific Data Hub accessed 31 August 2026; PSMSL database extract
            dated 24 August 2026.
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
