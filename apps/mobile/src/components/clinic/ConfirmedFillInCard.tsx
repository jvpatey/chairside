import { cancelConfirmedFillIn, deleteShiftPost } from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
  View,
} from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { DetailRow, RowDivider } from '@/components/clinic/DetailCard';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardDetailSection } from '@/components/ui/CardDetailSection';
import { ExpandableSurfaceCard } from '@/components/ui/ExpandableSurfaceCard';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import {
  formatFillInRoleLabel,
  formatShiftPostMeta,
  formatShiftPostTimeDetail,
} from '@/lib/shiftPostDisplay';
import { getClinicApplicationMessagesRoute, type ClinicApplicationReturnTarget } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ConfirmedFillInCardProps = {
  clinicId: string;
  workerName: string;
  workerPhotoStoragePath?: string | null;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
  applicationId: string;
  shiftPostId: string;
  expanded?: boolean;
  onExpandChange?: (expanded: boolean) => void;
  returnTo?: ClinicApplicationReturnTarget;
  onUpdated?: () => void;
};

export function ConfirmedFillInCard({
  clinicId,
  workerName,
  workerPhotoStoragePath,
  shiftDate,
  startTime,
  endTime,
  applicationId,
  shiftPostId,
  expanded = false,
  onExpandChange,
  returnTo = 'fill-ins-tab',
  onUpdated,
}: ConfirmedFillInCardProps) {
  const { colors } = useTheme();
  const [isSubmitting, setIsSubmitting] = useState<'cancel' | 'delete' | null>(null);
  const roleLabel = formatFillInRoleLabel(shiftDate);
  const shiftTimes = {
    shift_date: shiftDate,
    start_time: startTime ?? '',
    end_time: endTime ?? '',
  };
  const shiftMeta = formatShiftPostMeta(shiftTimes);
  const scheduleDetail = formatShiftPostTimeDetail(shiftTimes);

  const styles = useThemedStyles(({ spacing }) => ({
    confirmedAccessory: {
      paddingTop: 2,
    },
    detailsCard: {
      gap: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
    },
  }));

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onExpandChange?.(!expanded);
  };

  const handleCancelFillIn = () => {
    if (isSubmitting) return;

    showConfirmActionSheet({
      title: 'Cancel fill-in?',
      message: `Cancel the confirmation with ${workerName}? The fill-in will reopen for new cover requests.`,
      confirmLabel: 'Cancel fill-in',
      destructive: true,
      onConfirm: async () => {
        setIsSubmitting('cancel');
        try {
          await cancelConfirmedFillIn(applicationId);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not cancel fill-in',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          setIsSubmitting(null);
        }
      },
    });
  };

  const handleDeleteFillIn = () => {
    if (isSubmitting) return;

    showConfirmActionSheet({
      title: 'Delete fill-in?',
      message: `Permanently delete this fill-in and remove the confirmed record with ${workerName}?`,
      confirmLabel: 'Delete fill-in',
      destructive: true,
      onConfirm: async () => {
        setIsSubmitting('delete');
        try {
          await deleteShiftPost(clinicId, shiftPostId);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not delete fill-in',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          setIsSubmitting(null);
        }
      },
    });
  };

  const header = (
    <ApplicantPostHeader
      layout="split"
      displayName={workerName}
      photoStoragePath={workerPhotoStoragePath}
      eyebrow={roleLabel}
      title={workerName}
      detail={scheduleDetail}
      avatarSize={44}
      accessory={
        <View style={styles.confirmedAccessory}>
          <Ionicons name="checkmark-circle" size={22} color={colors.success} />
        </View>
      }
      textFooter={<ClinicApplicationStatusBadge status="hired" postType="shift" />}
    />
  );

  return (
    <ExpandableSurfaceCard
      header={header}
      expanded={expanded}
      onToggleExpand={toggleExpanded}
      variant="success"
      accent="secondary">
      <CardDetailSection title="Shift details">
        <View style={styles.detailsCard}>
          <DetailRow label="Name" value={workerName} />
          <RowDivider />
          <DetailRow label="Role" value={roleLabel} />
          <RowDivider />
          <DetailRow label="Schedule" value={scheduleDetail ?? shiftMeta} />
          <RowDivider />
          <DetailRow label="Status" value="Confirmed" />
        </View>
      </CardDetailSection>
      <View style={styles.actions}>
        <OnboardingButton
          label="Message"
          variant="secondary"
          onPress={() =>
            router.push(getClinicApplicationMessagesRoute(applicationId, returnTo))
          }
        />
        <OnboardingButton
          label={isSubmitting === 'cancel' ? 'Cancelling…' : 'Cancel fill-in'}
          variant="secondary"
          disabled={isSubmitting != null}
          onPress={handleCancelFillIn}
        />
        <OnboardingButton
          label={isSubmitting === 'delete' ? 'Deleting…' : 'Delete fill-in'}
          variant="destructive"
          disabled={isSubmitting != null}
          onPress={handleDeleteFillIn}
        />
      </View>
    </ExpandableSurfaceCard>
  );
}
