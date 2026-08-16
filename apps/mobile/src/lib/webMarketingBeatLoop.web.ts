import { useEffect, useRef, useState } from 'react';
import { type View } from 'react-native';

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Runs a short looping phase sequence once the node scrolls into view.
 * Used by How-it-works and Features marketing demos.
 */
export function useInViewPhaseLoop(scheduleMs: readonly number[], cycleMs: number) {
  const ref = useRef<View>(null);
  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setActive(true);
      setPhase(Math.max(0, scheduleMs.length - 1));
      return;
    }

    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setActive(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node as unknown as Element);
    return () => observer.disconnect();
  }, [scheduleMs.length]);

  useEffect(() => {
    if (!active || prefersReducedMotion() || typeof window === 'undefined') return;

    let timers: number[] = [];
    const run = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = scheduleMs.map((atMs, index) =>
        window.setTimeout(() => setPhase(index), atMs),
      );
    };

    run();
    const interval = window.setInterval(run, cycleMs);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, [active, cycleMs, scheduleMs]);

  return { ref, phase, active };
}
