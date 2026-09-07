import { getClinicDiscoverJobPost, type LiveJobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getClinicDiscoverClinicProfileRoute } from '@/lib/routing';
import { formatWorkerPostLocation, resolveWorkerPostLogoStoragePath } from '@/lib/workerPostLocation';
import { useThemedStyles } from '@/theme';

export default function ClinicDiscoverJobDetailScreen() {
  const { clinicId } = useClinicProfile();
  const { upgradePrompt, handleBillingError } = useClinicUpgradePrompt();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = typeof id === 'string' ? id : '';
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
  }));

  const loadJob = useCallback(async () => {
    if (!jobId || !clinicId) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextJob = await getClinicDiscoverJobPost(jobId, clinicId);
      if (!nextJob) {
        Alert.alert('Role not found', 'This posting may no longer be available.');
        router.back();
        return;
      }
      setJob(nextJob);
    } catch (error) {
      if (handleBillingError(error)) {
        router.back();
        return;
      }
      Alert.alert(
        'Could not load role',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, handleBillingError, jobId]);

  useRefreshOnFocus(loadJob);

  if (isLoading || !job) {
    return (
      <FormScreen
        title="Role details"
        subtitle={isLoading ? undefined : 'Role not found.'}
        onBack={() => router.back()}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  const location = formatWorkerPostLocation(job);

  return (
    <FormScreen
      eyebrow="Discover"
      title="Role details"
      subtitle={job.clinic.clinic_name}
      onBack={() => router.back()}>
      {upgradePrompt}
      <View style={styles.content}>
        <SurfaceCard>
          <ClinicPostHeader
            layout="split"
            clinicName={job.clinic.clinic_name}
            logoStoragePath={resolveWorkerPostLogoStoragePath(job)}
            title={job.title}
            location={location || null}
            detail={formatJobPostRoleMeta(job)}
            avatarSize={44}
          />
        </SurfaceCard>
        <JobPostDetailView job={job} featured={job.has_priority_listing} locationLabel={location || null} />
        <OnboardingButton
          label="View clinic profile"
          onPress={() =>
            router.push(
              getClinicDiscoverClinicProfileRoute(job.clinic_id, { fromJobId: job.id }),
            )
          }
        />
      </View>
    </FormScreen>
  );
}
