import { getOrCreateGeneralConversation, getPublicClinicPostings } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { WorkerPublicClinicProfileView } from '@/components/worker/WorkerPublicClinicProfileView';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getWorkerConversationRoute,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerClinicProfileScreen() {
  const { user } = useAuth();
  const { workerProfile } = useWorkerProfile();
  const { id } = useLocalSearchParams<{ id: string }>();
  const clinicId = typeof id === 'string' ? id : '';
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
        router.back();
        return;
      }
      setPostings(next);
    } catch (error) {
      Alert.alert(
        'Could not load clinic',
        error instanceof Error ? error.message : 'Please try again.',
      );
      router.back();
    } finally {
      setIsLoading(false);
    }
  }, [clinicId]);

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
          subtitle: 'General inquiry',
        }),
      );
    } catch (error) {
      Alert.alert(
        'Could not start conversation',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsStartingMessage(false);
    }
  };

  const profileComplete = Boolean(workerProfile?.setup_completed_at);
  const canMessage =
    Boolean(user?.id) &&
    profileComplete &&
    postings?.profile.accepts_general_candidate_messages;

  if (isLoading || !postings) {
    return (
      <OnboardingShell>
        <AuthScreenHeader
          title="Clinic profile"
          subtitle={isLoading ? undefined : 'Clinic not found.'}
          onBack={() => router.back()}
        />
        {isLoading ? <PageLoadingDetail /> : null}
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      footer={
        canMessage ? (
          <View style={styles.footer}>
            <OnboardingButton
              label={isStartingMessage ? 'Opening…' : 'Message clinic'}
              disabled={isStartingMessage}
              onPress={() => void handleMessageClinic()}
            />
          </View>
        ) : undefined
      }>
      <AuthScreenHeader
        title="Clinic profile"
        subtitle={postings.profile.clinic_name}
        onBack={() => router.back()}
      />
      <View style={styles.content}>
        <WorkerPublicClinicProfileView
          profile={postings.profile}
          jobs={postings.jobs}
          shifts={postings.shifts}
          onJobPress={(jobId) => router.push(getWorkerJobDetailRoute(jobId))}
          onShiftPress={(shiftId) => router.push(getWorkerShiftDetailRoute(shiftId))}
        />
      </View>
    </OnboardingShell>
  );
}
