import { getSupabaseClient } from '@chairside/api';
import { useEffect, useRef } from 'react';

/** Refresh application tab badges when applications change for the signed-in clinic. */
export function useClinicApplicationRealtime(
  clinicId: string | undefined,
  onChange: () => void | Promise<void>,
) {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!clinicId) return;

    const supabase = getSupabaseClient();
    const channel = supabase
      .channel(`clinic-applications:${clinicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
        },
        () => {
          void onChangeRef.current();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [clinicId]);
}
