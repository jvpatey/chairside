import {
  confirmFillInApplicant,
  getApplicantDisplayName,
  updateApplicationStatus,
  type ClinicApplication,
  type FillInCoverRequest,
} from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import {
  getClinicApplicationMessagesRoute,
  type ClinicApplicationReturnTarget,
  type FillInReturnTarget,
} from '@/lib/routing';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type FillInApplicantApplication = ClinicApplication | FillInCoverRequest;

type FillInApplicantCardProps = {
  application: FillInApplicantApplication;
  clinicId: string;
  returnTo?: ClinicApplicationReturnTarget | FillInReturnTarget;
  hasUnreadMessages?: boolean;
  onUpdated?: () => void;
  onConfirmed?: (payload: HiringCelebrationPayload) => void;
  accent?: GradientAccent;
};

function isPending(application: FillInApplicantApplication): boolean {
  return ['applied', 'reviewed', 'in_progress', 'interview_offered', 'interview_scheduled'].includes(
    application.status,
  );
}

function getShiftMeta(application: FillInApplicantApplication): string {
  if ('shift_date' in application) {
    return formatShiftPostMeta({
      shift_date: application.shift_date,
      start_time: application.shift_start_time,
      end_time: application.shift_end_time,
    });
  }
  return application.post_title;
}

export function FillInApplicantCard({
  application,
  clinicId,
  returnTo = 'fill-ins-tab',
  hasUnreadMessages = false,
  onUpdated,
  onConfirmed,
  accent = 'secondary',
}: FillInApplicantCardProps) {
  const { colors } = useTheme();
  const brandColor = accent === 'secondary' ? colors.secondary : colors.primary;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshPending, isCoverRequestHighlighted, getCoverRequestHighlightLabel } =
    useFillInPending();
  const { markApplicationSeen } = useApplicationTabBadge();
  const workerName = getApplicantDisplayName(application);
  const workerDeleted = application.worker_account_deleted;
  const pending = isPending(application) && !workerDeleted;
  const hasNewCoverRequest = isCoverRequestHighlighted(application);
  const newCoverRequestLabel = getCoverRequestHighlightLabel(application);

  useEffect(() => {
    if (hasNewCoverRequest) {
      void markApplicationSeen(application.id);
    }
  }, [application.id, hasNewCoverRequest, markApplicationSeen]);
  const messagesReturnTo =
    returnTo === 'fill-ins-tab' || returnTo === 'postings-fill-ins' || returnTo === 'dashboard-fill-ins'
      ? 'messages-tab'
      : returnTo;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    preview: {
      fontSize: 14,
      lineHeight: 20,
      fontStyle: 'italic',
      color: colors.labelSecondary,
      paddingLeft: 56,
    },
    unread: {
      fontSize: 13,
      fontWeight: '600',
      color: brandColor,
    },
    actions: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    action: { flex: 1, minWidth: 0 },
    deletedBanner: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    deletedText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const handleAccept = () => {
    showConfirmActionSheet({
      title: 'Accept cover request?',
      message: `Confirm ${workerName} for this fill-in? Other pending requests will be declined and the shift will be marked filled.`,
      confirmLabel: 'Accept',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await confirmFillInApplicant(clinicId, application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refreshPending();
          onConfirmed?.({
            applicationId: application.id,
            postType: 'shift',
            audience: 'clinic',
            counterpartName: workerName,
            postTitle: getRoleTypeLabel(application.post_role_type),
            shiftDateLabel: getShiftMeta(application),
          });
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not accept',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleDecline = () => {
    showConfirmActionSheet({
      title: 'Decline cover request?',
      message: `Decline ${workerName} for this fill-in?`,
      confirmLabel: 'Decline',
      destructive: true,
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await updateApplicationStatus(application.id, 'rejected');
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refreshPending();
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not decline',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  return (
    <View style={styles.card}>
      <ApplicantPostHeader
        displayName={workerName}
        photoStoragePath={workerDeleted ? null : application.worker_photo_storage_path}
        title={getRoleTypeLabel(application.post_role_type)}
        detail={[
          getShiftMeta(application),
          hasUnreadMessages ? 'New message' : null,
          newCoverRequestLabel,
        ]
          .filter(Boolean)
          .join(' · ')}
        avatarSize={44}
        accessory={
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {hasNewCoverRequest ? <ApplicationCardBadge /> : null}
            <ClinicApplicationStatusBadge status={application.status} postType="shift" />
          </View>
        }
      />

      {application.cover_message?.trim() ? (
        <Text style={styles.preview}>{`\u201C${application.cover_message.trim()}\u201D`}</Text>
      ) : null}

      {workerDeleted ? (
        <View style={styles.deletedBanner}>
          <Text style={styles.deletedText}>
            This candidate is no longer signed up for Chairside.
          </Text>
        </View>
      ) : null}

      {pending ? (
        <View style={styles.actions}>
          <OnboardingButton
            label={isSubmitting ? 'Accepting…' : 'Accept'}
            disabled={isSubmitting}
            accent={accent}
            onPress={handleAccept}
          />
          <View style={styles.row}>
            <OnboardingButton
              style={styles.action}
              label={hasUnreadMessages ? 'Message · New' : 'Message'}
              variant="secondary"
              disabled={isSubmitting}
              onPress={() =>
                router.push(getClinicApplicationMessagesRoute(application.id, messagesReturnTo))
              }
            />
            <OnboardingButton
              style={styles.action}
              label="Decline"
              variant="destructive"
              disabled={isSubmitting}
              onPress={handleDecline}
            />
          </View>
        </View>
      ) : application.status !== 'rejected' ? (
        <OnboardingButton
          label={
            workerDeleted
              ? 'View messages'
              : hasUnreadMessages
                ? 'Message · New'
                : 'Message'
          }
          variant="secondary"
          onPress={() =>
            router.push(getClinicApplicationMessagesRoute(application.id, messagesReturnTo))
          }
        />
      ) : null}
    </View>
  );
}
