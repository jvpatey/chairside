import {
  getLiveJobPost,
  hasAppliedToJob,
  isJobPostSaved,
  saveJobPost,
  unsaveJobPost,
  type LiveJobPost,
} from '@chairside/api';
import { getSpecialtyLabel } from '@chairside/config';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { JobPostDetailView } from '@/components/clinic/JobPostDetailView';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ClinicProfileLinkFooter } from '@/components/worker/ClinicProfileLinkFooter';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getApplyRoute,
  getWorkerClinicProfileRoute,
  getWorkerClinicProfileBackLabel,
  navigateAfterWorkerJobDetail,
  parseWorkerPostingReturnParams,
} from '@/lib/routing';
import { guardApply } from '@/lib/workerGuard';
import { resolvePostingAttributionLabels } from '@/hooks/useClinicActingContext';
import {
  formatWorkerPostLocation,
  resolveWorkerPostLocationParts,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import {
  buildLiveJobMatchDisplayContext,
  computeJobMatchBreakdown,
} from '@/lib/workerMatch';
import { useThemedStyles } from '@/theme';

export default function WorkerJobDetailScreen() {
  const { user } = useAuth();
  const { workerProfile, isProfileComplete } = useWorkerProfile();
  const { id, returnTo, applicationId, applicationReturnTo } = useLocalSearchParams<{
    id?: string;
    returnTo?: string;
    applicationId?: string;
    applicationReturnTo?: string;
  }>();
  const jobId = typeof id === 'string' ? id : '';
  const returnContext = useMemo(
    () =>
      parseWorkerPostingReturnParams({
        returnTo,
        applicationId,
        applicationReturnTo,
      }),
    [applicationId, applicationReturnTo, returnTo],
  );
  const backLabel = getWorkerClinicProfileBackLabel(returnContext);
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;
  const goBack = useCallback(() => {
    navigateAfterWorkerJobDetail(router, resolvedReturnTo, returnContext);
  }, [resolvedReturnTo, returnContext]);
  const [job, setJob] = useState<LiveJobPost | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
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
        const [applied, saved] = await Promise.all([
          hasAppliedToJob(user.id, jobId),
          isJobPostSaved(user.id, jobId),
        ]);
        setHasApplied(applied);
        setIsSaved(saved);
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

  const handleToggleSaved = useCallback(async () => {
    if (!user?.id || !job) return;
    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    try {
      if (nextSaved) await saveJobPost(job.id);
      else await unsaveJobPost(job.id);
    } catch (error) {
      setIsSaved(!nextSaved);
      Alert.alert(
        'Could not update saved role',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  }, [isSaved, job, user?.id]);

  const handleApply = () => {
    if (!job) return;
    guardApply(workerProfile, isProfileComplete, getApplyRoute('job', job.id));
  };

  if (isLoading || !job) {
    return (
      <FormScreen
        title="Role details"
        subtitle={isLoading ? undefined : 'Role not found.'}
        backLabel={backLabel}
        onBack={goBack}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  const location = formatWorkerPostLocation(job);
  const { displayName, placeLabel } = resolveWorkerPostLocationParts(job);
  const { postedByLabel, postedOnLabel } = resolvePostingAttributionLabels({
    postedAt: job.created_at,
    postedByDisplayName: job.posted_by_display_name,
    postedByTitle: job.posted_by_title,
  });
  const jobMatch = workerProfile ? computeJobMatchBreakdown(workerProfile, job) : null;
  const matchContext = workerProfile
    ? buildLiveJobMatchDisplayContext(workerProfile, job)
    : null;

  return (
    <FormScreen
      title="Role details"
      subtitle={job.clinic.clinic_name}
      backLabel={backLabel}
      onBack={goBack}
      headerAccessory={
        user?.id ? <SavePostButton isSaved={isSaved} onToggle={() => void handleToggleSaved()} /> : null
      }
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={hasApplied ? 'Applied' : 'Apply now'}
            disabled={hasApplied}
            onPress={handleApply}
          />
        </View>
      }>
      <View style={styles.content}>
        <JobPostDetailView
          job={job}
          part="hero"
          heroAccessory={
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
        <SurfaceCard
          onPress={() =>
            router.push(
              getWorkerClinicProfileRoute(
                job.clinic.clinic_id,
                returnContext?.returnTo === 'application-detail'
                  ? returnContext
                  : { returnTo: 'job-detail', jobId: job.id },
              ),
            )
          }>
          <ClinicPostHeader
            clinicName={displayName}
            logoStoragePath={resolveWorkerPostLogoStoragePath(job)}
            location={placeLabel}
            detail={getSpecialtyLabel(job.clinic.specialty)}
            detailIcon="medkit-outline"
            metaIcons
          />
          <ClinicProfileLinkFooter />
        </SurfaceCard>
        <JobPostDetailView
          job={job}
          part="body"
          locationLabel={job.location ? location : null}
          postedByLabel={postedByLabel}
          postedOnLabel={postedOnLabel}
        />
      </View>
    </FormScreen>
  );
}
