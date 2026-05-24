import { getLiveJobPost, hasAppliedToJob, type LiveJobPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getApplyRoute } from '@/lib/routing';
import { guardApply } from '@/lib/workerGuard';
import { useThemedStyles } from '@/theme';

export default function WorkerJobDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = typeof id === 'string' ? id : '';
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    content: { gap: spacing.lg },
    clinicCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.xs,
    },
    clinicLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    clinicName: { ...typography.body, fontWeight: '600' },
    clinicMeta: typography.subtitle,
  }));

  const loadJob = useCallback(async () => {
    if (!jobId) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextJob = await getLiveJobPost(jobId);
      if (!nextJob) {
        Alert.alert('Role not found', 'This posting may no longer be available.');
        router.back();
        return;
      }
      setJob(nextJob);

      if (user?.id) {
        const applied = await hasAppliedToJob(user.id, jobId);
        setHasApplied(applied);
      }
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

  const location = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');

  return (
    <OnboardingShell
      footer={
        <OnboardingButton
          label={hasApplied ? 'Applied' : 'Apply for this role'}
          disabled={hasApplied}
          onPress={() =>
            guardApply(workerProfile, isProfileComplete, getApplyRoute('job', job.id))
          }
        />
      }>
      <AuthScreenHeader title="Role details" subtitle={job.title} onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.clinicCard}>
          <Text style={styles.clinicLabel}>Clinic</Text>
          <Text style={styles.clinicName}>{job.clinic.clinic_name}</Text>
          {location ? <Text style={styles.clinicMeta}>{location}</Text> : null}
        </View>
        <JobPostDetailView job={job} />
      </View>
    </OnboardingShell>
  );
}
