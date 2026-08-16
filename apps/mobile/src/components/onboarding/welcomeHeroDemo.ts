import { useEffect, useState } from 'react';

/**
 * Phases of the auto-playing hero demo loop:
 * idle (blank beat) → post (fill-in card lands) → alert (phone push drops) → covered (mint pill pops).
 */
export type HeroDemoPhase = 'idle' | 'post' | 'alert' | 'covered';

/**
 * Timing leaves room for crossfades (~480ms) so each beat is readable before the next lands.
 * covered holds long enough that the outcome settles before a soft fade back to idle.
 */
const PHASE_SCHEDULE: { phase: HeroDemoPhase; atMs: number }[] = [
  { phase: 'idle', atMs: 0 },
  { phase: 'post', atMs: 600 },
  { phase: 'alert', atMs: 2800 },
  { phase: 'covered', atMs: 4800 },
];

/** Full cycle — covered holds, then brief idle fade before the next post. */
const CYCLE_MS = 10200;

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Drives the hero demo loop. When disabled (compact/auth) or reduced motion,
 * settles on the final 'covered' state so the composition still reads.
 */
export function useHeroDemoLoop(enabled: boolean): HeroDemoPhase {
  const [phase, setPhase] = useState<HeroDemoPhase>('covered');

  useEffect(() => {
    if (!enabled || prefersReducedMotion() || typeof window === 'undefined') {
      setPhase('covered');
      return;
    }

    let timers: number[] = [];
    const runCycle = () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers = PHASE_SCHEDULE.map(({ phase: nextPhase, atMs }) =>
        window.setTimeout(() => setPhase(nextPhase), atMs),
      );
    };

    runCycle();
    const interval = window.setInterval(runCycle, CYCLE_MS);
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      window.clearInterval(interval);
    };
  }, [enabled]);

  return phase;
}

export function heroPhaseAtLeast(phase: HeroDemoPhase, target: HeroDemoPhase): boolean {
  const order: HeroDemoPhase[] = ['idle', 'post', 'alert', 'covered'];
  return order.indexOf(phase) >= order.indexOf(target);
}
