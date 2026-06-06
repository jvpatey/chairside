import { getWorkerApplication, getUnreadConversationMap, getWorkerAppliedShiftPost, type WorkerApplication, type WorkerAppliedShiftPost } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { HiringCelebrationModal } from '@/components/celebration/HiringCelebrationModal';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { MasterDetailLayout } from '@/components/ui/MasterDetailLayout';
import { WorkerApplicationDetailCard } from '@/components/worker/WorkerApplicationDetailCard';
import { WorkerApplicationsInboxPanel } from '@/components/worker/WorkerApplicationsInboxPanel';
import { WorkerConfirmedFillInDetail } from '@/components/worker/WorkerConfirmedFillInDetail';
import { useAuth } from '@/contexts/AuthContext';
import { useHiringCelebration } from '@/hooks/useHiringCelebration';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useWorkerHiringCelebration } from '@/hooks/useWorkerHiringCelebration';
import { toCelebrationCandidate } from '@/lib/hiringCelebrationCandidates';
import {
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
  navigateAfterWorkerApplication,
} from '@/lib/routing';
import { getWorkerShiftApplicationCardDisplay } from '@/lib/workerShiftApplicationDisplay';
import { useThemedStyles } from '@/theme';

export default function WorkerApplicationDetailScreen() {
  const { user } = useAuth();
  const { isTablet } = useResponsiveLayout();
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const applicationId = typeof id === 'string' ? id : '';
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;
  const [application, setApplication] = useState<WorkerApplication | null>(null);
  const [confirmedShift, setConfirmedShift] = useState<WorkerAppliedShiftPost | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const {
    celebrationVisible,
    celebrationPayload,
    showCelebration,
    closeCelebration,
  } = useHiringCelebration();
  const { checkApplications } = useWorkerHiringCelebration(showCelebration);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  const goBack = useCallback(() => {
    navigateAfterWorkerApplication(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const load = useCallback(async () => {
    if (!user?.id || !applicationId) {
      setApplication(null);
      setConfirmedShift(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [row, unreadMap] = await Promise.all([
        getWorkerApplication(user.id, applicationId),
        getUnreadConversationMap(user.id, 'worker'),
      ]);
      if (!row) {
        const message = 'This application may have been removed.';
        setFormError(message);
        if (Platform.OS !== 'web') {
          Alert.alert('Application not found', message);
        }
        goBack();
        return;
      }
      setApplication(row);
      setFormError(null);
      setHasUnreadMessages(Boolean(unreadMap[applicationId]));

      if (row.post_type === 'shift' && row.status === 'hired' && row.shift_post_id) {
        const shift = await getWorkerAppliedShiftPost(row.shift_post_id);
        setConfirmedShift(shift);
      } else {
        setConfirmedShift(null);
      }

      await checkApplications([toCelebrationCandidate(row)]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load application', message);
      }
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, checkApplications, goBack, user?.id]);

  useRefreshOnFocus(load);

  const handleViewPosting = () => {
    if (!application) return;
    if (application.post_type === 'job' && application.job_post_id) {
      router.push(getWorkerJobDetailRoute(application.job_post_id));
      return;
    }
    if (application.post_type === 'shift' && application.shift_post_id) {
      router.push(getWorkerShiftDetailRoute(application.shift_post_id));
    }
  };

  const isConfirmedFillIn =
    application?.post_type === 'shift' && application.status === 'hired' && confirmedShift;

  const shiftDisplay =
    application?.post_type === 'shift' ? getWorkerShiftApplicationCardDisplay(application) : null;

  const subtitle = application
    ? isConfirmedFillIn
      ? shiftDisplay?.title ?? application.clinic_name
      : application.post_title
    : isLoading
      ? 'Loading…'
      : 'Application details';

  const headerTitle = isConfirmedFillIn ? 'Confirmed fill-in' : 'Application';

  const detail = (
    <OnboardingShell>
      <AuthScreenHeader
        title={headerTitle}
        subtitle={isConfirmedFillIn ? application?.clinic_name ?? subtitle : subtitle}
        onBack={goBack}
      />
      <View style={styles.content}>
        <FormErrorBanner message={formError} />
        {isConfirmedFillIn && application ? (
          <WorkerConfirmedFillInDetail
            application={application}
            shift={confirmedShift}
            returnTo={resolvedReturnTo}
            hasUnreadMessages={hasUnreadMessages}
          />
        ) : application ? (
          <WorkerApplicationDetailCard
            application={application}
            returnTo={resolvedReturnTo}
            hasUnreadMessages={hasUnreadMessages}
            onViewPosting={handleViewPosting}
            onUpdated={() => void load()}
            onCancelled={goBack}
            onHidden={goBack}
          />
        ) : null}
      </View>
    </OnboardingShell>
  );

  if (isTablet) {
    return (
      <>
        <MasterDetailLayout
          master={<WorkerApplicationsInboxPanel compact />}
          detail={detail}
          showDetail
        />
        <HiringCelebrationModal
          visible={celebrationVisible}
          payload={celebrationPayload}
          onClose={() => void closeCelebration()}
        />
      </>
    );
  }

  return (
    <>
      {detail}
      <HiringCelebrationModal
        visible={celebrationVisible}
        payload={celebrationPayload}
        onClose={() => void closeCelebration()}
      />
    </>
  );
}
