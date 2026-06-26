import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../constants";

interface ScrollProgressOptions {
  waitForFullVisibility?: boolean;
  travelScreens?: number;
}

interface PinnedElementProgressOptions {
  targetSelector: string;
  travelScreens?: number;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function useScrollProgress<T extends HTMLElement>(
  options: ScrollProgressOptions = {},
) {
  const ref = useRef<T>(null);
  const startScrollYRef = useRef<number | null>(null);
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

      if (options.waitForFullVisibility) {
        const fullyVisible = rect.top >= 0 && rect.bottom <= viewportHeight;
        if (!fullyVisible && startScrollYRef.current == null) {
          setProgress(0);
          return;
        }

        if (fullyVisible && startScrollYRef.current == null) {
          startScrollYRef.current = window.scrollY;
        }

        const startScrollY = startScrollYRef.current ?? window.scrollY;
        if (window.scrollY < startScrollY) {
          startScrollYRef.current = null;
          setProgress(0);
          return;
        }

        const travel = viewportHeight * (options.travelScreens ?? 1);
        setProgress(clamp((window.scrollY - startScrollY) / travel));
        return;
      }

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
  }, [options.travelScreens, options.waitForFullVisibility]);

  return { ref, progress };
}

export function usePinnedElementProgress<T extends HTMLElement>({
  targetSelector,
  travelScreens = 1.2,
}: PinnedElementProgressOptions) {
  const ref = useRef<T>(null);
  const startScrollYRef = useRef(0);
  const travelRef = useRef(1);
  const [progress, setProgress] = useState(
    prefersReducedMotion.matches ? 1 : 0,
  );

  useEffect(() => {
    if (prefersReducedMotion.matches) {
      setProgress(1);
      return;
    }

    let frame = 0;

    const measure = () => {
      const root = ref.current;
      const target = root?.querySelector<HTMLElement>(targetSelector);
      if (!root || !target) return;

      const viewportHeight = window.innerHeight || 1;
      const stickyTop = Number.parseFloat(getComputedStyle(target).top) || 0;
      const previousPosition = target.style.position;
      const previousTop = target.style.top;

      target.style.position = "relative";
      target.style.top = "auto";
      const naturalTop = target.getBoundingClientRect().top + window.scrollY;
      target.style.position = previousPosition;
      target.style.top = previousTop;

      startScrollYRef.current = naturalTop - stickyTop;
      travelRef.current = viewportHeight * travelScreens;
    };

    const update = () => {
      frame = 0;
      setProgress(
        clamp((window.scrollY - startScrollYRef.current) / travelRef.current),
      );
    };

    const requestUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    const handleResize = () => {
      measure();
      requestUpdate();
    };

    measure();
    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, [targetSelector, travelScreens]);

  return { ref, progress };
}
