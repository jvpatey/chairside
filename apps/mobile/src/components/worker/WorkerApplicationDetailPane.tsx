import {
  getUnreadConversationMap,
  getWorkerApplication,
  getWorkerAppliedShiftPost,
  type WorkerApplication,
  type WorkerAppliedShiftPost,
} from '@chairside/api';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { FormErrorBanner } from '@/components/ui/FormErrorBanner';
import { FormScreen } from '@/components/ui/FormScreen';
import { PageLoadingDetail } from '@/components/ui/PageLoadingState';
import { WorkerApplicationDetailCard } from '@/components/worker/WorkerApplicationDetailCard';
import { WorkerConfirmedFillInDetail } from '@/components/worker/WorkerConfirmedFillInDetail';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useRefreshOnFocus } from '@/hooks/useRefreshOnFocus';
import {
  getWorkerApplicationPostingReturnOptions,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { useThemedStyles } from '@/theme';

type WorkerApplicationDetailPaneProps = {
  applicationId: string;
  returnTo?: WorkerApplicationReturnTarget;
  /** Split-view detail: Close clears selection instead of leaving the Applications hub. */
  onClose?: () => void;
  embedded?: boolean;
};

export function WorkerApplicationDetailPane({
  applicationId,
  returnTo = 'applications-tab',
  onClose,
  embedded = false,
}: WorkerApplicationDetailPaneProps) {
  const { user } = useAuth();
  const [application, setApplication] = useState<WorkerApplication | null>(null);
  const [confirmedShift, setConfirmedShift] = useState<WorkerAppliedShiftPost | null>(null);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const { markApplicationSeen, refreshPending } = useApplicationTabBadge();

  const styles = useThemedStyles(({ spacing }) => ({
    content: { gap: spacing.lg },
  }));

  const handleClosed = useCallback(async () => {
    setApplication(null);
    setConfirmedShift(null);
    setFormError(null);
    onClose?.();
    await refreshPending();
  }, [onClose, refreshPending]);

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
        onClose?.();
        return;
      }
      setApplication(row);
      setFormError(null);
      await markApplicationSeen(row.id);
      setHasUnreadMessages(Boolean(unreadMap[applicationId]));

      if (row.post_type === 'shift' && row.status === 'hired' && row.shift_post_id) {
        const shift = await getWorkerAppliedShiftPost(row.shift_post_id);
        setConfirmedShift(shift);
      } else {
        setConfirmedShift(null);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      setFormError(message);
      if (Platform.OS !== 'web') {
        Alert.alert('Could not load application', message);
      }
      onClose?.();
    } finally {
      setIsLoading(false);
    }
  }, [applicationId, markApplicationSeen, onClose, user?.id]);

  useRefreshOnFocus(load);

  const handleViewPosting = () => {
    if (!application) return;
    const postingReturnOptions = getWorkerApplicationPostingReturnOptions(
      application.id,
      returnTo,
    );
    if (application.post_type === 'job' && application.job_post_id) {
      router.push(getWorkerJobDetailRoute(application.job_post_id, postingReturnOptions));
      return;
    }
    if (application.post_type === 'shift' && application.shift_post_id) {
      router.push(getWorkerShiftDetailRoute(application.shift_post_id, postingReturnOptions));
    }
  };

  const isConfirmedFillIn =
    application?.post_type === 'shift' && application.status === 'hired' && confirmedShift;

  const headerTitle = isConfirmedFillIn ? 'Confirmed fill-in' : 'Your application';
  const headerSubtitle = isConfirmedFillIn ? application?.clinic_name : undefined;

  return (
    <FormScreen
      title={headerTitle}
      subtitle={headerSubtitle}
      accent="tertiary"
      onBack={onClose}
      backLabel={embedded ? 'Close' : undefined}
      transparentBackground={embedded && Platform.OS === 'web'}
    >
      <View style={styles.content}>
        <FormErrorBanner message={formError} />
        {isLoading ? (
          <PageLoadingDetail />
        ) : isConfirmedFillIn && application ? (
          <WorkerConfirmedFillInDetail
            application={application}
            shift={confirmedShift}
            returnTo={returnTo}
            hasUnreadMessages={hasUnreadMessages}
            onCancelled={() => void handleClosed()}
          />
        ) : application ? (
          <WorkerApplicationDetailCard
            application={application}
            returnTo={returnTo}
            hasUnreadMessages={hasUnreadMessages}
            onViewPosting={handleViewPosting}
            onUpdated={() => void load()}
            onCancelled={() => void handleClosed()}
            onHidden={() => void handleClosed()}
          />
        ) : null}
      </View>
    </FormScreen>
  );
}
