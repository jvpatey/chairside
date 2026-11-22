import {
  getLiveJobPost,
  hasAppliedToJob,
  isJobPostSaved,
  isSourcedListing,
  recordJobPostListingView,
  saveJobPost,
  unsaveJobPost,
  type LiveJobPost,
} from '@chairside/api';
import { formatJobPostRoleMeta, getSpecialtyLabel } from '@chairside/config';
import { isMatchableSoftware } from '@chairside/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { SourcedListingContactActions } from '@/components/worker/SourcedListingContactActions';
import {
  WorkerCompanionListingBody,
  type CompanionFact,
} from '@/components/worker/WorkerCompanionListingBody';
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
import {
  formatWorkerPostLocation,
  resolveWorkerPostLocationParts,
} from '@/lib/workerPostLocation';
import { getWorkerPostMapsDestination } from '@/lib/workerPostMaps';
import { useThemedStyles } from '@/theme';

function buildJobFacts(job: LiveJobPost): CompanionFact[] {
  // Role / employment / place live in the hero — only extras here.
  const facts: CompanionFact[] = [];
  if (job.schedule?.trim()) {
    facts.push({ label: 'Schedule', value: job.schedule.trim() });
  }
  if (job.specialty?.trim()) {
    facts.push({ label: 'Specialty', value: getSpecialtyLabel(job.specialty) });
  }
  const software = job.software_used.filter(isMatchableSoftware).join(' · ');
  if (software) {
    facts.push({ label: 'Software', value: software });
  }
  return facts;
}

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
        void recordJobPostListingView(jobId).catch(() => {
          // Reach tracking is best-effort — never block the detail screen.
        });
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
    if (!job || isSourcedListing(job)) return;
    guardApply(workerProfile, isProfileComplete, getApplyRoute('job', job.id));
  };

  if (isLoading || !job) {
    return (
      <FormScreen
        title="Role"
        subtitle={isLoading ? undefined : 'Role not found.'}
        backLabel={backLabel}
        onBack={goBack}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  const sourced = isSourcedListing(job);
  const { displayName, placeLabel } = resolveWorkerPostLocationParts(job);
  const place =
    (job.location ? formatWorkerPostLocation(job) : null) || placeLabel || null;
  const facts = buildJobFacts(job);
  const mapsDestination = getWorkerPostMapsDestination(job);

  return (
    <FormScreen
      title="Role"
      backLabel={backLabel}
      onBack={goBack}
      headerAccessory={
        user?.id ? <SavePostButton isSaved={isSaved} onToggle={() => void handleToggleSaved()} /> : null
      }
      footer={
        sourced ? (
          <SourcedListingContactActions contact={job} sections="buttons" />
        ) : (
          <OnboardingButton
            label={hasApplied ? 'Applied' : 'Apply now'}
            disabled={hasApplied}
            onPress={handleApply}
          />
        )
      }>
      <View style={styles.content}>
        <WorkerCompanionListingBody
          title={job.title}
          subtitle={formatJobPostRoleMeta(job)}
          pay={job.wage_range}
          clinicName={displayName}
          place={place}
          onClinicPress={
            !sourced && job.clinic_id
              ? () =>
                  router.push(
                    getWorkerClinicProfileRoute(
                      job.clinic_id!,
                      returnContext?.returnTo === 'application-detail'
                        ? returnContext
                        : { returnTo: 'job-detail', jobId: job.id },
                    ),
                  )
              : undefined
          }
          facts={facts}
          notes={job.description}
          contact={sourced ? job : null}
          mapsDestination={mapsDestination}
        />
      </View>
    </FormScreen>
  );
}
