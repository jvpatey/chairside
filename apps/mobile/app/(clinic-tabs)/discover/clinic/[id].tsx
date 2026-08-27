import { Redirect, useLocalSearchParams } from 'expo-router';

import { getClinicDiscoverClinicProfileRoute } from '@/lib/routing';

/** Older Discover links used a nested path; keep them working. */
export default function ClinicDiscoverClinicProfileRedirect() {
  const { id, fromJobId, fromShiftId } = useLocalSearchParams<{
    id?: string;
    fromJobId?: string;
    fromShiftId?: string;
  }>();
  const clinicId = typeof id === 'string' ? id : '';

  if (!clinicId) {
    return <Redirect href="/(clinic-tabs)/discover" />;
  }

  return (
    <Redirect
      href={getClinicDiscoverClinicProfileRoute(clinicId, {
        fromJobId: typeof fromJobId === 'string' ? fromJobId : undefined,
        fromShiftId: typeof fromShiftId === 'string' ? fromShiftId : undefined,
      })}
    />
  );
}
