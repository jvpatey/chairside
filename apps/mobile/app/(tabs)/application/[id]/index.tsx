import { getWorkerApplication, getUnreadConversationMap, type WorkerApplication } from '@chairside/api';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { WorkerApplicationDetailCard } from '@/components/worker/WorkerApplicationDetailCard';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
  navigateAfterWorkerApplication,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export default function WorkerApplicationDetailScreen() {
  const { user } = useAuth();
  const { id, returnTo } = useLocalSearchParams<{ id?: string; returnTo?: string }>();
  const applicationId = typeof id === 'string' ? id : '';
  const resolvedReturnTo = typeof returnTo === 'string' ? returnTo : undefined;
  const [application, setApplication] = useState<WorkerApplication | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  const goBack = useCallback(() => {
    navigateAfterWorkerApplication(router, resolvedReturnTo);
  }, [resolvedReturnTo]);

  const load = useCallback(async () => {
    if (!user?.id || !applicationId) {
      setApplication(null);
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
        Alert.alert('Application not found', 'This application may have been removed.');
        goBack();
        return;
      }
      setApplication(row);
      setHasUnreadMessages(Boolean(unreadMap[applicationId]));
    } catch (error) {
      Alert.alert(
        'Could not load application',
        error instanceof Error ? error.message : 'Please try again.',
      );
      goBack();
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, goBack, user?.id]);

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

  const subtitle = application
    ? application.post_title
    : isLoading
      ? 'Loading…'
      : 'Application details';

  return (
    <OnboardingShell>
      <AuthScreenHeader title="Application" subtitle={subtitle} onBack={goBack} />
      <View style={styles.content}>
        {application ? (
          <WorkerApplicationDetailCard
            application={application}
            returnTo={resolvedReturnTo}
            hasUnreadMessages={hasUnreadMessages}
            onViewPosting={handleViewPosting}
            onUpdated={() => void load()}
            onCancelled={() => {
              Alert.alert('Application cancelled', 'Your application was removed.');
              goBack();
            }}
          />
        ) : null}
      </View>
    </OnboardingShell>
  );
}
