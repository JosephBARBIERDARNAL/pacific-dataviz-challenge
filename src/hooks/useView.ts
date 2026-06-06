import { useCallback, useEffect, useRef, useState } from "react";
import type { SeaLevelData, View } from "../types";

function getViewFromUrl(): View {
  const value = new URL(window.location.href).searchParams.get("view");
  if (!value) return "global";
  return value.toLowerCase() === "global" ? "global" : value.toUpperCase();
}

function updateUrl(view: View, replace = false): void {
  const url = new URL(window.location.href);
  url.searchParams.set("view", view);
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ view }, "", url);
}

interface ViewState {
  selectedView: View;
  selectView: (view: View) => void;
}

export function useView(data: SeaLevelData | null): ViewState {
  const [selectedView, setSelectedView] = useState<View>("global");
  const selectedViewRef = useRef(selectedView);
  selectedViewRef.current = selectedView;

  const isValidView = useCallback(
    (view: View) =>
      view === "global" || (data?.summaryByCountry.has(view) ?? false),
    [data],
  );

  // Resolve the requested ?view= once data is available, and follow
  // browser history navigation afterwards.
  useEffect(() => {
    if (!data) return;

    const requested = getViewFromUrl();
    const resolved = isValidView(requested) ? requested : "global";
    setSelectedView(resolved);
    if (requested !== resolved) updateUrl(resolved, true);

    const onPopState = () => {
      const view = getViewFromUrl();
      setSelectedView(isValidView(view) ? view : "global");
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [data, isValidView]);

  const selectView = useCallback(
    (view: View) => {
      if (!isValidView(view)) return;
      if (view === selectedViewRef.current) return;
      updateUrl(view);
      setSelectedView(view);
    },
    [isValidView],
  );

  return { selectedView, selectView };
}
