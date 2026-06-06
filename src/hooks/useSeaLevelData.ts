import { useEffect, useState } from "react";
import { loadSeaLevelData } from "../lib/loadData";
import type { SeaLevelData } from "../types";

interface SeaLevelDataState {
  data: SeaLevelData | null;
  error: string | null;
}

export function useSeaLevelData(): SeaLevelDataState {
  const [state, setState] = useState<SeaLevelDataState>({
    data: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    loadSeaLevelData()
      .then((data) => {
        if (!cancelled) setState({ data, error: null });
      })
      .catch((error: unknown) => {
        console.error(error);
        if (!cancelled) {
          setState({
            data: null,
            error:
              "The data files could not be loaded. Check the network connection and reload.",
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
