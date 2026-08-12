import { getErrorMessage, getOrCreateGeneralConversation, getPublicClinicPostings } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { WorkerPublicClinicProfileView } from '@/components/worker/WorkerPublicClinicProfileView';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getWorkerConversationRoute,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
  getWorkerClinicProfileBackLabel,
  navigateAfterWorkerClinicProfile,
  parseWorkerClinicProfileReturnParams,
  WORKER_PROFILE,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerClinicProfileScreen() {
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const { id, returnTo, conversationId, jobId, shiftId, applicationId, applicationReturnTo } =
    useLocalSearchParams<{
    id?: string;
    returnTo?: string;
    conversationId?: string;
    jobId?: string;
    shiftId?: string;
    applicationId?: string;
    applicationReturnTo?: string;
  }>();
  const clinicId = typeof id === 'string' ? id : '';
  const returnContext = useMemo(
    () =>
      parseWorkerClinicProfileReturnParams({
        returnTo,
        conversationId,
        jobId,
        shiftId,
        applicationId,
        applicationReturnTo,
      }),
    [applicationId, applicationReturnTo, conversationId, jobId, returnTo, shiftId],
  );
  const backLabel = getWorkerClinicProfileBackLabel(returnContext);
  const goBack = useCallback(() => {
    navigateAfterWorkerClinicProfile(router, returnContext);
  }, [returnContext]);
  const [postings, setPostings] = useState<Awaited<ReturnType<typeof getPublicClinicPostings>>>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingMessage, setIsStartingMessage] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    content: {
      gap: spacing.lg,
    },
    footer: {
      gap: spacing.sm,
    },
  }));

  const load = useCallback(async () => {
    if (!clinicId) {
      setPostings(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const next = await getPublicClinicPostings(clinicId);
      if (!next) {
        Alert.alert('Clinic not found', 'This clinic profile may no longer be available.');
        goBack();
        return;
      }
      setPostings(next);
    } catch (error) {
      Alert.alert(
        'Could not load clinic',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [clinicId, goBack]);

  useRefreshOnFocus(load);

  const handleMessageClinic = async () => {
    if (!user?.id || !postings?.profile || isStartingMessage) return;

    setIsStartingMessage(true);
    try {
      const conversationId = await getOrCreateGeneralConversation(postings.profile.clinic_id);
      router.push(
        getWorkerConversationRoute(conversationId, {
          conversationId,
          title: postings.profile.clinic_name,
          subtitle: 'Open inquiry',
        }),
      );
    } catch (error) {
      Alert.alert(
        'Could not start conversation',
        getErrorMessage(error, 'Please try again.'),
      );
    } finally {
      setIsStartingMessage(false);
    }
  };

  const profileComplete = Boolean(workerProfile?.setup_completed_at);
  const acceptsGeneralMessages = Boolean(postings?.profile.accepts_general_candidate_messages);
  const canMessage = Boolean(user?.id) && profileComplete && acceptsGeneralMessages;
  const messageFooterLabel = isStartingMessage
    ? 'Opening…'
    : acceptsGeneralMessages
      ? 'Message clinic'
      : undefined;

  if (isLoading || !postings) {
    return (
      <FormScreen
        title="Clinic profile"
        subtitle={isLoading ? undefined : 'Clinic not found.'}
        backLabel={backLabel}
        onBack={goBack}>
        {isLoading ? <PageLoadingDetail /> : null}
      </FormScreen>
    );
  }

  return (
    <FormScreen
      title="Clinic profile"
      subtitle={postings.profile.clinic_name}
      backLabel={backLabel}
      onBack={goBack}
      footer={
        canMessage ? (
          <View style={styles.footer}>
            <OnboardingButton
              label={messageFooterLabel ?? 'Message clinic'}
              disabled={isStartingMessage}
              onPress={() => void handleMessageClinic()}
            />
          </View>
        ) : acceptsGeneralMessages && !profileComplete ? (
          <View style={styles.footer}>
            <OnboardingButton
              label="Complete profile to message"
              onPress={() => router.push(WORKER_PROFILE)}
            />
          </View>
        ) : undefined
      }>
      <View style={styles.content}>
        <WorkerPublicClinicProfileView
          profile={postings.profile}
          jobs={postings.jobs}
          shifts={postings.shifts}
          onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getWorkerShiftDetailRoute(shiftId))}
        />
      </View>
    </FormScreen>
  );
}
