import { cancelConfirmedFillIn, type WorkerApplication, type WorkerAppliedShiftPost } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';

import { ShiftPostDetailView } from '@/components/clinic/ShiftPostDetailView';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { WorkerClinicDetailView } from '@/components/worker/WorkerClinicDetailView';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import {
  getWorkerApplicationMessagesRoute,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

type WorkerConfirmedFillInDetailProps = {
  application: WorkerApplication;
  shift: WorkerAppliedShiftPost;
  returnTo?: WorkerApplicationReturnTarget;
  hasUnreadMessages?: boolean;
  onCancelled?: () => void;
};

export function WorkerConfirmedFillInDetail({
  application,
  shift,
  returnTo = 'fill-ins-tab',
  hasUnreadMessages = false,
  onCancelled,
}: WorkerConfirmedFillInDetailProps) {
  const [isCancelling, setIsCancelling] = useState(false);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: { gap: spacing.lg },
    heroCard: {
      backgroundColor: `${colors.success}10`,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: `${colors.success}40`,
      padding: spacing.md,
    },
    actions: {
      gap: spacing.sm,
    },
  }));

  const location = [
    shift.clinic.address_line1,
    shift.clinic.city,
    shift.clinic.province,
    shift.clinic.postal_code,
  ]
    .filter(Boolean)
    .join(' · ');

  const handleMessage = () => {
    router.push(getWorkerApplicationMessagesRoute(application.id, returnTo));
  };

  const handleCancelShift = () => {
    if (isCancelling) return;

    showConfirmActionSheet({
      title: 'Cancel confirmed shift?',
      message:
        'This cancels your confirmed fill-in. The clinic will be notified and the shift may reopen for other candidates.',
      confirmLabel: 'Cancel shift',
      destructive: true,
      onConfirm: async () => {
        setIsCancelling(true);
        try {
          await cancelConfirmedFillIn(application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert('Shift cancelled', 'Your confirmed fill-in has been cancelled.', [
            { text: 'OK', onPress: () => onCancelled?.() },
          ]);
        } catch (error) {
          Alert.alert(
            'Could not cancel shift',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          setIsCancelling(false);
        }
      },
    });
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.heroCard}>
        <ClinicPostHeader
          clinicName={shift.clinic.clinic_name}
          logoStoragePath={shift.clinic.logo_storage_path}
          location={location || null}
          detail={formatShiftPostMeta(shift)}
          avatarSize={48}
          textFooter={
            <WorkerApplicationStatusBadge status={application.status} postType="shift" />
          }
        />
      </View>

      <ShiftPostDetailView
        shift={shift}
        softwareUsed={shift.clinic.software_used}
        showStatusBadge={false}
      />

      <WorkerClinicDetailView clinic={shift.clinic} />

      <View style={styles.actions}>
        <OnboardingButton
          label={hasUnreadMessages ? 'Message clinic · New' : 'Message clinic'}
          onPress={handleMessage}
        />
        <OnboardingButton
          label={isCancelling ? 'Cancelling…' : 'Cancel shift'}
          variant="destructive"
          disabled={isCancelling}
          onPress={handleCancelShift}
        />
      </View>
    </View>
  );
}
