import {
  createApplication,
  getLiveJobPost,
  hasAppliedToJob,
  type LiveJobPost,
} from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  WORKER_APPLICATIONS,
  WORKER_SETUP_APPLICATION,
  getApplyRoute,
} from '@/lib/routing';
import { guardQuickApply } from '@/lib/workerGuard';
import {
  buildLiveJobMatchDisplayContext,
  computeJobMatchBreakdown,
} from '@/lib/workerMatch';
import { useThemedStyles } from '@/theme';

export default function WorkerJobDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete, refreshWorkerProfile } = useWorkerProfile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = typeof id === 'string' ? id : '';
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canQuickApply = isProfileComplete;

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
    footer: { gap: spacing.sm },
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

  const handleQuickApply = async () => {
    if (!user?.id || !job) return;

    if (!canQuickApply) {
      guardQuickApply(workerProfile, WORKER_SETUP_APPLICATION);
      return;
    }

    setIsSubmitting(true);
    try {
      await createApplication(user.id, {
        jobPostId: job.id,
        coverMessage: workerProfile?.default_cover_message ?? undefined,
      });
      await refreshWorkerProfile();
      setHasApplied(true);
      Alert.alert('Application sent', 'Your application kit was submitted to the clinic.', [
        { text: 'View applications', onPress: () => router.replace(WORKER_APPLICATIONS) },
        { text: 'OK', style: 'cancel' },
      ]);
    } catch (error) {
      Alert.alert(
        'Application failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

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
  const jobMatch = workerProfile ? computeJobMatchBreakdown(workerProfile, job) : null;
  const matchContext = workerProfile
    ? buildLiveJobMatchDisplayContext(workerProfile, job)
    : null;

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={
              hasApplied ? 'Applied' : isSubmitting ? 'Applying…' : 'Quick apply'
            }
            disabled={hasApplied || isSubmitting}
            onPress={handleQuickApply}
          />
          {!hasApplied ? (
            <OnboardingButton
              label="Apply with note"
              variant="secondary"
              disabled={isSubmitting}
              onPress={() => router.push(getApplyRoute('job', job.id))}
            />
          ) : null}
        </View>
      }>
      <AuthScreenHeader title="Role details" subtitle={job.title} onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.clinicCard}>
          <Text style={styles.clinicLabel}>Clinic</Text>
          <Text style={styles.clinicName}>{job.clinic.clinic_name}</Text>
          {location ? <Text style={styles.clinicMeta}>{location}</Text> : null}
          {jobMatch && matchContext ? (
            <MatchTierBadge
              breakdown={jobMatch}
              context={matchContext}
              subtitle={job.title}
              showProfileHint
            />
          ) : null}
        </View>
        <JobPostDetailView job={job} />
      </View>
    </OnboardingShell>
  );
}
