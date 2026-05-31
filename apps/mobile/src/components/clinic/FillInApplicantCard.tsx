import {
  confirmFillInApplicant,
  updateApplicationStatus,
  type ClinicApplication,
  type FillInCoverRequest,
} from '@chairside/api';
import { getRoleTypeLabel } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import {
  getClinicApplicationMessagesRoute,
  type ClinicApplicationReturnTarget,
  type FillInReturnTarget,
} from '@/lib/routing';
import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

type FillInApplicantApplication = ClinicApplication | FillInCoverRequest;

type FillInApplicantCardProps = {
  application: FillInApplicantApplication;
  clinicId: string;
  returnTo?: ClinicApplicationReturnTarget | FillInReturnTarget;
  hasUnreadMessages?: boolean;
  onUpdated?: () => void;
  onConfirmed?: (payload: HiringCelebrationPayload) => void;
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
}: FillInApplicantCardProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const workerName = application.worker_display_name?.trim() || 'Applicant';
  const pending = isPending(application);
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
      color: colors.primary,
    },
    actions: { gap: spacing.sm },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    action: { flex: 1, minWidth: 0 },
  }));

  const handleAccept = () => {
    Alert.alert(
      'Accept cover request?',
      `Confirm ${workerName} for this fill-in? Other pending requests will be declined and the shift will be marked filled.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: () => {
            void (async () => {
              setIsSubmitting(true);
              try {
                await confirmFillInApplicant(clinicId, application.id);
                void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            })();
          },
        },
      ],
    );
  };

  const handleDecline = () => {
    Alert.alert('Decline cover request?', `Decline ${workerName} for this fill-in?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsSubmitting(true);
            try {
              await updateApplicationStatus(application.id, 'rejected');
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onUpdated?.();
            } catch (error) {
              Alert.alert(
                'Could not decline',
                error instanceof Error ? error.message : 'Please try again.',
              );
            } finally {
              setIsSubmitting(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.card}>
      <ApplicantPostHeader
        displayName={workerName}
        photoStoragePath={application.worker_photo_storage_path}
        title={getRoleTypeLabel(application.post_role_type)}
        detail={[
          getShiftMeta(application),
          hasUnreadMessages ? 'New message' : null,
        ]
          .filter(Boolean)
          .join(' · ')}
        avatarSize={44}
        accessory={<ClinicApplicationStatusBadge status={application.status} postType="shift" />}
      />

      {application.cover_message?.trim() ? (
        <Text style={styles.preview}>{`\u201C${application.cover_message.trim()}\u201D`}</Text>
      ) : null}

      {pending ? (
        <View style={styles.actions}>
          <OnboardingButton
            label={isSubmitting ? 'Accepting…' : 'Accept'}
            disabled={isSubmitting}
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
          label={hasUnreadMessages ? 'Message · New' : 'Message'}
          variant="secondary"
          onPress={() =>
            router.push(getClinicApplicationMessagesRoute(application.id, messagesReturnTo))
          }
        />
      ) : null}
    </View>
  );
}
