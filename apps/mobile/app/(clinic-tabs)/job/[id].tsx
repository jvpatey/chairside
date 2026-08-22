import { getJobPost, type JobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { JobPostManageMenu } from '@/components/clinic/JobPostManageMenu';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { resolveClinicJobLocationLabel } from '@/lib/clinicPostingListDisplay';
import { getEditJobRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function JobDetailScreen() {
  const { user } = useAuth();
  const { locations, clinicProfile, isGroup } = useClinicProfile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = typeof id === 'string' ? id : '';
  const [job, setJob] = useState<JobPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    footerButton: {
      flex: 1,
    },
  }));

  const loadJob = useCallback(async () => {
    if (!jobId || !user?.id) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextJob = await getJobPost(user.id, jobId);
      if (!nextJob) {
        Alert.alert('Role not found', 'This posting may have been removed.');
        router.back();
        return;
      }
      setJob(nextJob);
    } catch (error) {
      Alert.alert(
        'Could not load role',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [jobId, user?.id]);

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

  const locationLabel = isGroup
    ? resolveClinicJobLocationLabel(job, locations, clinicProfile)
    : null;

  return (
    <FormScreen
      eyebrow="Role details"
      title={job.title}
      subtitle={formatJobPostRoleMeta(job)}
      onBack={() => router.back()}
      footer={
        <View style={styles.footer}>
          {user?.id ? (
            <JobPostManageMenu
              style={styles.footerButton}
              clinicId={user.id}
              job={job}
              onUpdated={setJob}
              onDeleted={() => router.back()}
            />
          ) : null}
          <OnboardingButton
            style={styles.footerButton}
            label="Edit role"
            onPress={() => router.push(getEditJobRoute(job.id))}
          />
        </View>
      }>
      <View style={styles.content}>
        <JobPostDetailView job={job} locationLabel={locationLabel || null} />
      </View>
    </FormScreen>
  );
}
