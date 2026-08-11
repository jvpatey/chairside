import { getErrorMessage, getPublicClinicPostings } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert } from 'react-native';

import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { WorkerPublicClinicProfileView } from '@/components/worker/WorkerPublicClinicProfileView';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getClinicDiscoverJobDetailRoute,
  getClinicDiscoverShiftDetailRoute,
} from '@/lib/routing';

export default function ClinicDiscoverClinicProfileScreen() {
  const { id, fromJobId, fromShiftId } = useLocalSearchParams<{
    id?: string;
    fromJobId?: string;
    fromShiftId?: string;
  }>();
  const clinicId = typeof id === 'string' ? id : '';
  const [postings, setPostings] = useState<Awaited<
    ReturnType<typeof getPublicClinicPostings>
  > | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clinicId) {
      setPostings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const next = await getPublicClinicPostings(clinicId);
      if (!next?.profile) {
        Alert.alert('Clinic not found', 'This clinic may no longer be available.');
        router.back();
        return;
      }
      setPostings(next);
    } catch (error) {
      Alert.alert('Could not load clinic', getErrorMessage(error, 'Please try again.'));
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

  useRefreshOnFocus(load);

  const handleBack = () => {
    if (typeof fromJobId === 'string' && fromJobId) {
      router.replace(getClinicDiscoverJobDetailRoute(fromJobId));
      return;
    }
    if (typeof fromShiftId === 'string' && fromShiftId) {
      router.replace(getClinicDiscoverShiftDetailRoute(fromShiftId));
      return;
    }
    router.back();
  };

  if (isLoading || !postings?.profile) {
    return (
      <FormScreen
        title="Clinic profile"
        subtitle={isLoading ? undefined : 'Clinic not found.'}
        onBack={handleBack}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  return (
    <FormScreen
      eyebrow="Discover"
      title={postings.profile.clinic_name}
      subtitle={[postings.profile.city, postings.profile.province].filter(Boolean).join(', ') || undefined}
      onBack={handleBack}>
      <WorkerPublicClinicProfileView
        audience="clinic"
        profile={postings.profile}
        jobs={postings.jobs}
        shifts={postings.shifts}
        onJobPress={(jobId) => router.push(getClinicDiscoverJobDetailRoute(jobId))}
        onShiftPress={(shiftId) => router.push(getClinicDiscoverShiftDetailRoute(shiftId))}
      />
    </FormScreen>
  );
}
