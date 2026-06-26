import { useCallback, useEffect, useRef, useState } from "react";
import { GLOBAL_VIEW, VIEW_QUERY_PARAM } from "../constants";
import type { SeaLevelData, View } from "../types";

function getViewFromUrl(): View {
  const value = new URL(window.location.href).searchParams.get(VIEW_QUERY_PARAM);
  if (!value) return GLOBAL_VIEW;
  return value.toLowerCase() === GLOBAL_VIEW ? GLOBAL_VIEW : value.toUpperCase();
}

function updateUrl(view: View, replace = false): void {
  const url = new URL(window.location.href);
  url.searchParams.set(VIEW_QUERY_PARAM, view);
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({ view }, "", url);
}

interface ViewState {
  selectedView: View;
  selectView: (view: View) => void;
}

export function useView(data: SeaLevelData | null): ViewState {
  const [selectedView, setSelectedView] = useState<View>(GLOBAL_VIEW);
  const selectedViewRef = useRef(selectedView);
  selectedViewRef.current = selectedView;

  const isValidView = useCallback(
    (view: View) =>
      view === GLOBAL_VIEW || (data?.summaryByCountry.has(view) ?? false),
    [data],
  );

  // Resolve the requested ?view= once data is available, and follow
  // browser history navigation afterwards.
  useEffect(() => {
    if (!data) return;

    const requested = getViewFromUrl();
    const resolved = isValidView(requested) ? requested : GLOBAL_VIEW;
    setSelectedView(resolved);
    if (requested !== resolved) updateUrl(resolved, true);

    const onPopState = () => {
      const view = getViewFromUrl();
      setSelectedView(isValidView(view) ? view : GLOBAL_VIEW);
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
