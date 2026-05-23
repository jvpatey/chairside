import { getJobPost, type JobPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { JobPostManageMenu } from '@/components/clinic/JobPostManageMenu';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getEditJobRoute } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function JobDetailScreen() {
  const { user } = useAuth();
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
      <OnboardingShell>
        <AuthScreenHeader
          title="Role details"
          subtitle={isLoading ? 'Loading…' : 'Role not found.'}
          onBack={() => router.back()}
        />
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
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
        <AuthScreenHeader onBack={() => router.back()} />
        <JobPostDetailView job={job} />
      </View>
    </OnboardingShell>
  );
}
