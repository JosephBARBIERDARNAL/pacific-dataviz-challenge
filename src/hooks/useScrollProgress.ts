import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../constants";

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function useScrollProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [progress, setProgress] = useState(
    prefersReducedMotion.matches ? 1 : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion.matches) {
      setProgress(1);
      return;
    }

    let frame = 0;

    const update = () => {
      frame = 0;
      const element = ref.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const viewportHeight = window.innerHeight || 1;
      const raw = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      setProgress(clamp((raw - 0.08) / 0.78));
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
    };
  }, []);

  return { ref, progress };
}
