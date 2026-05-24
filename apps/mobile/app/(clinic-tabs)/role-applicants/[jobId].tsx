import { getJobPost, listClinicApplicationsForJob, type ClinicApplication } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ClinicApplicationCard } from '@/components/clinic/ClinicApplicationCard';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useThemedStyles } from '@/theme';

export default function ClinicRoleApplicationsScreen() {
  const { user } = useAuth();
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();
  const resolvedJobId = typeof jobId === 'string' ? jobId : '';
  const [postTitle, setPostTitle] = useState('');
  const [applications, setApplications] = useState<ClinicApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.md },
    empty: typography.subtitle,
  }));

  const load = useCallback(async () => {
    if (!user?.id || !resolvedJobId) {
      setApplications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [job, rows] = await Promise.all([
        getJobPost(user.id, resolvedJobId),
        listClinicApplicationsForJob(user.id, resolvedJobId),
      ]);
      setPostTitle(job?.title ?? 'Role applicants');
      setApplications(rows);
    } catch (error) {
      setApplications([]);
      Alert.alert(
        'Could not load applicants',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [resolvedJobId, user?.id]);

  useRefreshOnFocus(load);

  return (
    <OnboardingShell>
      <AuthScreenHeader
        title={postTitle || 'Role applicants'}
        subtitle={
          isLoading
            ? 'Loading…'
            : applications.length === 1
              ? '1 applicant'
              : `${applications.length} applicants`
        }
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        {applications.length === 0 && !isLoading ? (
          <Text style={styles.empty}>No applicants for this role yet.</Text>
        ) : (
          <View style={styles.list}>
            {applications.map((application) => (
              <ClinicApplicationCard
                key={application.id}
                application={application}
                onUpdated={() => void load()}
              />
            ))}
          </View>
        )}
      </View>
    </OnboardingShell>
  );
}
