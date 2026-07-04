import { useEffect } from 'react';

/** Closes overlays on Escape key — web only. */
export function useWebEscapeKey(onEscape: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onEscape();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, onEscape]);
}
