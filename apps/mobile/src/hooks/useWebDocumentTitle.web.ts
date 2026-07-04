import { useEffect } from 'react';

/** Sets document.title on web routes. No-op on native. */
export function useWebDocumentTitle(title: string) {
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = title;
    }
  }, [title]);
}
