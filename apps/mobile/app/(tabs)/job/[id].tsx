import {
  getLiveJobPost,
  hasAppliedToJob,
  type LiveJobPost,
} from '@chairside/api';
import { getSpecialtyLabel } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { getApplyRoute } from '@/lib/routing';
import { guardApply } from '@/lib/workerGuard';
import {
  buildLiveJobMatchDisplayContext,
  computeJobMatchBreakdown,
} from '@/lib/workerMatch';
import { useThemedStyles } from '@/theme';

export default function WorkerJobDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const jobId = typeof id === 'string' ? id : '';
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    content: { gap: spacing.lg },
    clinicCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
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

  const handleApply = () => {
    if (!job) return;
    guardApply(workerProfile, isProfileComplete, getApplyRoute('job', job.id));
  };

  if (isLoading || !job) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title="Role details"
          subtitle={isLoading ? undefined : 'Role not found.'}
          onBack={() => router.back()}
        />
        {isLoading ? <PageLoadingDetail /> : null}
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
            label={hasApplied ? 'Applied' : 'Apply now'}
            disabled={hasApplied}
            onPress={handleApply}
          />
        </View>
      }>
      <AuthScreenHeader title="Role details" subtitle={job.clinic.clinic_name} onBack={() => router.back()} />
      <View style={styles.content}>
        <View style={styles.clinicCard}>
          <ClinicPostHeader
            clinicName={job.clinic.clinic_name}
            logoStoragePath={job.clinic.logo_storage_path}
            location={location || null}
            detail={getSpecialtyLabel(job.clinic.specialty)}
            accessory={
              jobMatch && matchContext ? (
                <MatchTierBadge
                  breakdown={jobMatch}
                  context={matchContext}
                  subtitle={job.title}
                  showProfileHint
                />
              ) : null
            }
          />
        </View>
        <JobPostDetailView job={job} />
      </View>
    </OnboardingShell>
  );
}
