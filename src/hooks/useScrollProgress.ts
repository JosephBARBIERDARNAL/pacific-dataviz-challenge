import { useEffect, useRef, useState } from "react";
import { SCROLL_PROGRESS, prefersReducedMotion } from "../constants";

interface ScrollProgressOptions {
  waitForFullVisibility?: boolean;
  travelScreens?: number;
}

interface PinnedElementProgressOptions {
  targetSelector: string;
  scrollContainerSelector?: string;
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

        const travel =
          viewportHeight *
          (options.travelScreens ?? SCROLL_PROGRESS.defaultTravelScreens);
        setProgress(clamp((window.scrollY - startScrollY) / travel));
        return;
      }

      const raw = (viewportHeight - rect.top) / (viewportHeight + rect.height);
      setProgress(
        clamp(
          (raw - SCROLL_PROGRESS.viewportOffset) /
            SCROLL_PROGRESS.viewportSpan,
        ),
      );
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
  scrollContainerSelector,
  targetSelector,
  travelScreens = SCROLL_PROGRESS.defaultPinnedTravelScreens,
}: PinnedElementProgressOptions) {
  const ref = useRef<T>(null);
  const startScrollYRef = useRef(0);
  const travelRef = useRef(1);
  const originalMinHeightRef = useRef<string | null>(null);
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

      const scrollContainer = scrollContainerSelector
        ? (root.querySelector<HTMLElement>(scrollContainerSelector) ?? root)
        : root;
      if (originalMinHeightRef.current == null) {
        originalMinHeightRef.current = scrollContainer.style.minHeight;
      }

      const viewportHeight = window.innerHeight || 1;
      const stickyTop = Number.parseFloat(getComputedStyle(target).top) || 0;
      scrollContainer.style.minHeight = originalMinHeightRef.current;
      const previousPosition = target.style.position;
      const previousTop = target.style.top;

      target.style.position = "relative";
      target.style.top = "auto";
      const naturalTop = target.getBoundingClientRect().top + window.scrollY;
      const targetHeight = target.getBoundingClientRect().height;
      const containerTop =
        scrollContainer.getBoundingClientRect().top + window.scrollY;
      const containerMinHeight =
        Number.parseFloat(getComputedStyle(scrollContainer).minHeight) || 0;
      target.style.position = previousPosition;
      target.style.top = previousTop;

      const travel = viewportHeight * travelScreens;
      startScrollYRef.current = naturalTop - stickyTop;
      travelRef.current = travel;
      scrollContainer.style.minHeight = `${Math.ceil(
        Math.max(
          containerMinHeight,
          naturalTop -
            containerTop +
            targetHeight +
            travel +
            SCROLL_PROGRESS.lockBufferPx,
        ),
      )}px`;
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
      const root = ref.current;
      const scrollContainer = scrollContainerSelector
        ? root?.querySelector<HTMLElement>(scrollContainerSelector)
        : root;
      if (scrollContainer && originalMinHeightRef.current != null) {
        scrollContainer.style.minHeight = originalMinHeightRef.current;
      }
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, [scrollContainerSelector, targetSelector, travelScreens]);

  return { ref, progress };
}
