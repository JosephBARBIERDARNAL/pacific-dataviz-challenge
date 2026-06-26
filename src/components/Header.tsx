import { GLOBAL_VIEW, RECORD_RANGES, VIEW_QUERY_PARAM } from "../constants";
import type { ChartRecord, CountryOption, View } from "../types";

interface HeaderProps {
  countries: CountryOption[];
  selectedView: View;
  onSelect: (view: View) => void;
  selectedRecord: ChartRecord;
  onSelectRecord: (record: ChartRecord) => void;
}

export function Header({
  countries,
  selectedView,
  onSelect,
  selectedRecord,
  onSelectRecord,
}: HeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a
          className="wordmark"
          href={`?${VIEW_QUERY_PARAM}=${GLOBAL_VIEW}`}
          onClick={(event) => {
            event.preventDefault();
            onSelect(GLOBAL_VIEW);
          }}
        >
          Pacific sea level
        </a>

        <div className="header-place-controls">
          <span className="header-control-label">Place</span>
          <button
            className="header-control-button"
            type="button"
            aria-pressed={selectedView === GLOBAL_VIEW}
            onClick={() => onSelect(GLOBAL_VIEW)}
          >
            Global
          </button>
          <label className="header-select-wrap">
            <span className="sr-only">Choose a country or territory</span>
            <select
              value={selectedView === GLOBAL_VIEW ? "" : selectedView}
              disabled={countries.length === 0}
              onChange={(event) => onSelect(event.target.value)}
            >
              <option value="" disabled>
                Select country
              </option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.country}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div
          className="record-switcher"
          role="group"
          aria-label="Choose the sea-level record to display"
        >
          <span className="header-control-label">Record</span>
          <button
            className="record-button record-button--historical"
            type="button"
            aria-pressed={selectedRecord === "historical"}
            onClick={() => onSelectRecord("historical")}
          >
            Tide gauges
            <span>{RECORD_RANGES.historical.label}</span>
          </button>
          <button
            className="record-button record-button--satellite"
            type="button"
            aria-pressed={selectedRecord === "satellite"}
            onClick={() => onSelectRecord("satellite")}
          >
            Satellite
            <span>{RECORD_RANGES.satellite.label}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
