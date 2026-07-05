import {
  confirmFillInApplicant,
  getApplicantDisplayName,
  updateApplicationStatus,
  type ClinicApplication,
  type FillInCoverRequest,
} from '@chairside/api';
import { getRoleTypeLabel, hasClinicWorkerCrmContent } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { ClinicWorkerCrmBadges } from '@/components/clinic/ClinicWorkerCrmSheet';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useFillInPending } from '@/contexts/FillInPendingContext';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import {
  getClinicApplicationMessagesRoute,
  getClinicApplicationRoute,
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
  return [
    'applied',
    'reviewed',
    'in_progress',
    'interview_offered',
    'interview_scheduled',
  ].includes(application.status);
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
  const { refreshPending, isCoverRequestHighlighted, getCoverRequestHighlightLabel } =
    useFillInPending();
  const { markApplicationSeen } = useApplicationTabBadge();
  const submittingActionRef = useRef<'accept' | 'decline' | null>(null);
  const [submittingAction, setSubmittingAction] = useState<'accept' | 'decline' | null>(null);
  const workerName = getApplicantDisplayName(application);
  const workerDeleted = application.worker_account_deleted;
  const pending = isPending(application) && !workerDeleted;
  const isSubmitting = submittingAction != null;
  const hasNewCoverRequest = isCoverRequestHighlighted(application);
  const newCoverRequestLabel = getCoverRequestHighlightLabel(application);
  const crmRecord = 'clinic_crm' in application ? application.clinic_crm : null;
  const showNewBadge = hasNewCoverRequest;
  const showStatusBadge = !(hasNewCoverRequest && application.status === 'applied');

  useEffect(() => {
    if (hasNewCoverRequest) {
      void markApplicationSeen(application.id);
    }
  }, [application.id, hasNewCoverRequest, markApplicationSeen]);

  const messagesReturnTo =
    returnTo === 'fill-ins-tab' ||
    returnTo === 'postings-fill-ins' ||
    returnTo === 'dashboard-fill-ins'
      ? 'messages-tab'
      : returnTo;

  const openDetail = () => {
    router.push(getClinicApplicationRoute(application.id, messagesReturnTo));
  };

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
    headerPress: {
      marginHorizontal: -spacing.xs,
    },
    chevronRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.xs,
    },
  }));

  const handleAccept = () => {
    if (submittingActionRef.current != null || isSubmitting) return;
    showConfirmActionSheet({
      title: 'Accept cover request?',
      message: `Confirm ${workerName} for this fill-in? Other pending requests will be declined and the shift will be marked filled.`,
      confirmLabel: 'Accept',
      onConfirm: async () => {
        if (submittingActionRef.current != null) return;
        submittingActionRef.current = 'accept';
        setSubmittingAction('accept');
        try {
          const confirmed = await confirmFillInApplicant(clinicId, application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          await refreshPending();
          onConfirmed?.({
            applicationId: application.id,
            postType: 'shift',
            audience: 'clinic',
            counterpartName: workerName,
            postTitle: getRoleTypeLabel(application.post_role_type),
            shiftDateLabel: getShiftMeta(application),
            applicationUpdatedAt: confirmed.updated_at,
          });
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not accept',
            error instanceof Error ? error.message : 'Please try again.',
          );
        } finally {
          submittingActionRef.current = null;
          setSubmittingAction(null);
        }
      },
    });
  };

  const handleDecline = () => {
    if (submittingActionRef.current != null || isSubmitting) return;
    showConfirmActionSheet({
      title: 'Decline cover request?',
      message: `Decline ${workerName} for this fill-in?`,
      confirmLabel: 'Decline',
      destructive: true,
      onConfirm: async () => {
        if (submittingActionRef.current != null) return;
        submittingActionRef.current = 'decline';
        setSubmittingAction('decline');
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
          submittingActionRef.current = null;
          setSubmittingAction(null);
        }
      },
    });
  };

  return (
    <View style={styles.card}>
      <Pressable style={styles.headerPress} onPress={openDetail}>
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
              {showNewBadge ? <ApplicationCardBadge label={newCoverRequestLabel ?? 'New'} /> : null}
              {showStatusBadge ? (
                <ClinicApplicationStatusBadge
                  status={application.status}
                  postType="shift"
                  statusClosedBy={application.status_closed_by}
                />
              ) : null}
              <View style={styles.chevronRow}>
                <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
              </View>
            </View>
          }
          footer={
            hasClinicWorkerCrmContent(crmRecord) ? (
              <ClinicWorkerCrmBadges record={crmRecord} compact />
            ) : null
          }
        />
      </Pressable>

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
            label={submittingAction === 'accept' ? 'Accepting...' : 'Accept'}
            accent={accent}
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
              label={submittingAction === 'decline' ? 'Declining...' : 'Decline'}
              variant="destructive"
              disabled={isSubmitting}
              onPress={handleDecline}
            />
          </View>
        </View>
      ) : application.status !== 'rejected' ? (
        <OnboardingButton
          label={workerDeleted ? 'View messages' : hasUnreadMessages ? 'Message · New' : 'Message'}
          variant="secondary"
          onPress={() =>
            router.push(getClinicApplicationMessagesRoute(application.id, messagesReturnTo))
          }
        />
      ) : null}
    </View>
  );
}
