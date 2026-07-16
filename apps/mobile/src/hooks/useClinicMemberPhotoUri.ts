import { getClinicMemberPhotoSignedUrl } from '@chairside/api';
import { useEffect, useState } from 'react';

export function useClinicMemberPhotoUri(storagePath: string | null | undefined) {
  const [uri, setUri] = useState<string | null>(null);

  useEffect(() => {
    if (!storagePath?.trim()) {
      setUri(null);
      return;
    }

    let cancelled = false;

    void getClinicMemberPhotoSignedUrl(storagePath)
      .then((signedUrl) => {
        if (!cancelled) setUri(signedUrl);
      })
      .catch(() => {
        if (!cancelled) setUri(null);
      });

    return () => {
      cancelled = true;
    };
  }, [storagePath]);

  return uri;
}
