import { getClinicLogoSignedUrl } from '@chairside/api';
import { useEffect, useRef, useState } from 'react';

/**
 * Resolve a clinic logo storage path to a displayable signed URL.
 * Keeps the previous URI while refetching so the avatar does not flash initials.
 */
export function useClinicLogoUri(storagePath: string | null | undefined) {
  const [uri, setUri] = useState<string | null>(null);
  const pathRef = useRef<string | null>(null);

  useEffect(() => {
    const nextPath = storagePath?.trim() || null;
    pathRef.current = nextPath;

    if (!nextPath) {
      setUri(null);
      return;
    }

    let cancelled = false;

    void getClinicLogoSignedUrl(nextPath)
      .then((signedUrl) => {
        if (cancelled || pathRef.current !== nextPath) return;
        setUri(signedUrl);
      })
      .catch(() => {
        // Keep any existing URI for this path; only clear when the path itself is gone.
        if (cancelled || pathRef.current !== nextPath) return;
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return uri;
}
