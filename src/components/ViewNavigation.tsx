import type { CountryOption, View } from "../types";
import { Globe } from "./Globe";

interface ViewNavigationProps {
  countries: CountryOption[];
  selectedView: View;
  focusKey: number;
  onSelect: (view: View) => void;
}

export function ViewNavigation({
  countries,
  selectedView,
  focusKey,
  onSelect,
}: ViewNavigationProps) {
  const views: CountryOption[] = [
    { code: "global", country: "Global" },
    ...countries,
  ];

  return (
    <nav className="view-navigation" aria-label="Choose a regional or country view">
      <div className="navigation-copy">
        <p className="eyebrow">Explore the Pacific</p>
        <h2 className="navigation-title">Choose a country or territory</h2>
        <p className="navigation-note">
          Select a marker, drag the globe, or use the complete list.
        </p>
        <div className="view-controls">
          <div className="view-select-wrap">
            <label htmlFor="country-select">Choose a view</label>
            <select
              id="country-select"
              value={selectedView}
              onChange={(event) => onSelect(event.target.value)}
            >
              {views.map((view) => (
                <option key={view.code} value={view.code}>
                  {view.country}
                </option>
              ))}
            </select>
          </div>
          <button
            id="global-view-button"
            className="global-view-button"
            type="button"
            aria-pressed={selectedView === "global"}
            onClick={() => onSelect("global")}
          >
            Global view
          </button>
        </div>
      </div>
      <Globe
        countries={countries}
        selectedView={selectedView}
        focusKey={focusKey}
        onSelect={onSelect}
      />
    </nav>
  );
}
