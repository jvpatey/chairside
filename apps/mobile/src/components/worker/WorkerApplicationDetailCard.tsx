import {
  acceptApplicationInterview,
  acceptApplicationInterviewUpdate,
  cancelScheduledApplicationInterview,
  declineApplicationInterview,
  declineApplicationInterviewUpdate,
  deleteApplication,
  proposeApplicationInterviewUpdateAsWorker,
  type ClinicApplication,
  type WorkerApplication,
} from '@chairside/api';
import {
  canWorkerHideApplication,
  formatApplicationDate,
  formatInterviewDateTime,
  hasApplicationKitSubmitted,
  hasPendingInterviewProposal,
  isActiveApplicationStatus,
  isAwaitingApplicationKit,
  isScreeningStageStatus,
} from '@chairside/config';
import { Alert, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  DetailProse,
} from '@/components/clinic/DetailCard';
import { CardDetailSection } from '@/components/ui/CardDetailSection';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { CardSectionDivider } from '@/components/ui/CardTitleSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ApplicationSubmittedFields } from '@/components/worker/ApplicationSubmittedFields';
import { ApplicationScreeningPreview } from '@/components/clinic/ApplicationScreeningSection';
import { ApplicationPreviewGroup } from '@/components/worker/ApplicationPreviewGroup';
import { WorkerApplicationKitSubmission } from '@/components/worker/WorkerApplicationKitSubmission';
import { InterviewScheduleSheet } from '@/components/clinic/InterviewScheduleSheet';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import {
  buildInterviewInviteInputFromApplication,
  openInterviewCalendarInvite,
} from '@/lib/calendarInvite';
import {
  getWorkerApplicationMessagesRoute,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { useThemedStyles, spacing } from '@/theme';
import { confirmHideWorkerApplication } from '@/lib/workerApplicationHide';

type WorkerApplicationDetailCardProps = {
  application: WorkerApplication;
  returnTo?: WorkerApplicationReturnTarget;
  onViewPosting?: () => void;
  onCancelled?: () => void;
  onUpdated?: () => void;
  onHidden?: () => void;
  hasUnreadMessages?: boolean;
  /** Inline body only — for expandable list cards. */
  variant?: 'full' | 'embedded';
};

function formatAppliedLabel(application: WorkerApplication): string | null {
  const date = formatApplicationDate(application.created_at);
  if (!date) return null;
  if (application.post_type === 'shift') return `Requested ${date}`;
  if (isScreeningStageStatus(application.status) && !hasApplicationKitSubmitted(application)) {
    return `Screening submitted ${date}`;
  }
  return `Applied ${date}`;
}

export function WorkerApplicationDetailCard({
  application,
  returnTo = 'applications-tab',
  onViewPosting,
  onCancelled,
  onUpdated,
  onHidden,
  hasUnreadMessages = false,
  variant = 'full',
}: WorkerApplicationDetailCardProps) {
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const clinicDeleted = application.clinic_account_deleted;
  const canCancel = isActiveApplicationStatus(application.status) && !clinicDeleted;
  const canHide = canWorkerHideApplication(application);
  const isShift = application.post_type === 'shift';
  const jobMatch = !isShift ? parseApplicationJobMatch(application) : null;
  const matchContext = !isShift ? getApplicationMatchDisplayContext(application) : null;
  const clinicLocation = application.clinic_city ?? null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    metaLabel: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    appliedDate: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelTertiary,
    },
    bodyEmbedded: {
      gap: spacing.lg,
    },
    submittedWrap: {
      gap: spacing.sm,
    },
    actionsGrid: {
      gap: spacing.sm,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    actionCell: {
      flex: 1,
      minWidth: 0,
    },
    mutedText: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  const handleMessage = () => {
    router.push(getWorkerApplicationMessagesRoute(application.id, returnTo));
  };

  const handleViewPosting = () => {
    if (onViewPosting) {
      onViewPosting();
      return;
    }
    if (application.post_type === 'job' && application.job_post_id) {
      router.push(getWorkerJobDetailRoute(application.job_post_id));
      return;
    }
    if (application.post_type === 'shift' && application.shift_post_id) {
      router.push(getWorkerShiftDetailRoute(application.shift_post_id));
    }
  };

  const canViewPosting =
    !clinicDeleted &&
    Boolean(
      onViewPosting ||
        (application.post_type === 'job' && application.job_post_id) ||
        (application.post_type === 'shift' && application.shift_post_id),
    );

  const interviewSummary = formatInterviewDateTime(
    application.interview_at,
    application.interview_duration_minutes,
  );
  const proposedSummary = formatInterviewDateTime(
    application.interview_proposed_at,
    application.interview_proposed_duration_minutes,
  );
  const pendingProposal = hasPendingInterviewProposal(application);
  const clinicProposedChange =
    pendingProposal && application.interview_proposed_by === 'clinic';
  const workerProposedChange =
    pendingProposal && application.interview_proposed_by === 'worker';
  const awaitingKit = isAwaitingApplicationKit(application);
  const hasKitSubmitted = hasApplicationKitSubmitted(application);
  const isScreeningStage = isScreeningStageStatus(application.status);

  const handleAddInterviewToCalendar = () => {
    const inviteInput = buildInterviewInviteInputFromApplication({
      clinicName: application.clinic_name,
      roleTitle: application.post_title,
      interviewAt: application.interview_at ?? '',
      durationMinutes: application.interview_duration_minutes,
      details: application.interview_details,
    });

    if (!inviteInput) return;

    void (async () => {
      try {
        await openInterviewCalendarInvite(inviteInput);
      } catch (error) {
        Alert.alert(
          'Could not open calendar',
          error instanceof Error ? error.message : 'Please try again.',
        );
      }
    })();
  };

  const handleAcceptInterview = () => {
    showConfirmActionSheet({
      title: 'Accept interview?',
      message: 'Confirm that you can attend at the proposed date and time.',
      confirmLabel: 'Accept interview',
      onConfirm: async () => {
        try {
          await acceptApplicationInterview(application.worker_id, application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not accept interview',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const handleAcceptProposal = () => {
    showConfirmActionSheet({
      title: 'Accept new time?',
      message: 'Your confirmed interview will move to the proposed time.',
      confirmLabel: 'Accept',
      onConfirm: async () => {
        try {
          await acceptApplicationInterviewUpdate(application.id, application.worker_id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not accept',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const handleDeclineProposal = () => {
    showConfirmActionSheet({
      title: 'Decline new time?',
      message: 'Your confirmed interview time will stay as scheduled.',
      confirmLabel: 'Decline',
      destructive: true,
      onConfirm: async () => {
        try {
          await declineApplicationInterviewUpdate(application.id, application.worker_id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not decline',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const handleCancelScheduledInterview = () => {
    showConfirmActionSheet({
      title: 'Cancel interview?',
      message:
        'You will return to the shortlist for this role. You can request a new time or keep messaging the clinic.',
      confirmLabel: 'Cancel interview',
      destructive: true,
      onConfirm: async () => {
        try {
          await cancelScheduledApplicationInterview(application.id, 'worker');
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not cancel interview',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const handleDeclineInterview = () => {
    showConfirmActionSheet({
      title: 'Decline interview?',
      message: 'The clinic will be notified. You will remain shortlisted for this role.',
      confirmLabel: 'Decline',
      destructive: true,
      onConfirm: async () => {
        try {
          await declineApplicationInterview(application.worker_id, application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Could not decline interview',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const handleCancel = () => {
    showConfirmActionSheet({
      title: isShift ? 'Withdraw cover request?' : 'Cancel application?',
      message: isShift
        ? 'This removes your request from the clinic. You can request to cover again if the shift is still open.'
        : 'This removes your application from the clinic. You can apply again later if the posting is still open.',
      confirmLabel: isShift ? 'Withdraw request' : 'Cancel application',
      destructive: true,
      onConfirm: async () => {
        try {
          await deleteApplication(application.worker_id, application.id);
          onCancelled?.();
        } catch (error) {
          Alert.alert(
            isShift ? 'Could not withdraw request' : 'Could not cancel application',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const primarySlots: {
    key: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }[] = [
    {
      key: 'message',
      label: clinicDeleted
        ? 'View messages'
        : hasUnreadMessages
          ? 'Message · New'
          : 'Message',
      onPress: handleMessage,
    },
    {
      key: 'posting',
      label: application.post_type === 'job' ? 'View role' : 'View shift',
      onPress: handleViewPosting,
      disabled: !canViewPosting,
    },
  ];

  const secondarySlots: {
    key: string;
    label: string;
    variant: 'secondary' | 'destructive';
    onPress: () => void;
  }[] = [];

  if (canCancel) {
    secondarySlots.push({
      key: 'cancel',
      label: isShift ? 'Withdraw' : 'Cancel',
      variant: 'destructive',
      onPress: handleCancel,
    });
  }

  if (canHide) {
    secondarySlots.push({
      key: 'hide',
      label: 'Remove from list',
      variant: 'destructive',
      onPress: () => confirmHideWorkerApplication(application, () => onHidden?.()),
    });
  }

  type ActionSlot = {
    key: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
    variant: 'primary' | 'secondary' | 'destructive';
  };

  const actionRows: ActionSlot[][] = [];
  const [messageSlot, ...otherPrimarySlots] = primarySlots;

  if (messageSlot) {
    actionRows.push([{ ...messageSlot, variant: 'primary' }]);
  }

  const pairedRow: ActionSlot[] = [
    ...otherPrimarySlots.map((slot) => ({ ...slot, variant: 'primary' as const })),
    ...secondarySlots.map((slot) => ({ ...slot, disabled: undefined })),
  ];

  if (pairedRow.length === 1) {
    actionRows.push(pairedRow);
  } else if (pairedRow.length > 1) {
    for (const slot of pairedRow) {
      actionRows.push([slot]);
    }
  }

  const hasActions = actionRows.length > 0;

  const bodyContent = (
    <>
      <View style={variant === 'embedded' ? styles.bodyEmbedded : undefined}>
        {clinicDeleted ? (
          <CardInfoPanel variant="default">
            <CardInfoPanelText>
              This clinic is no longer signed up for Chairside.
            </CardInfoPanelText>
          </CardInfoPanel>
        ) : null}

        {!clinicDeleted && application.status === 'interview_offered' && interviewSummary ? (
          <CardInfoPanel variant="warning" icon="calendar-outline" title="Interview invitation">
            <CardInfoPanelText>{interviewSummary}</CardInfoPanelText>
            {application.interview_details ? (
              <CardInfoPanelText>{application.interview_details}</CardInfoPanelText>
            ) : null}
            <OnboardingButton label="Accept interview" onPress={handleAcceptInterview} />
            <OnboardingButton
              label="Decline"
              variant="destructive"
              onPress={handleDeclineInterview}
            />
          </CardInfoPanel>
        ) : null}

        {!clinicDeleted && application.status === 'interview_scheduled' && interviewSummary ? (
          <CardInfoPanel variant="info" icon="calendar-outline" title="Interview confirmed">
            <CardInfoPanelText>{interviewSummary}</CardInfoPanelText>
            {application.interview_details ? (
              <CardInfoPanelText>{application.interview_details}</CardInfoPanelText>
            ) : null}
            {clinicProposedChange && proposedSummary ? (
              <CardInfoPanelText>Clinic proposed · {proposedSummary}</CardInfoPanelText>
            ) : null}
            {workerProposedChange && proposedSummary ? (
              <CardInfoPanelText>
                Awaiting clinic response · {proposedSummary}
              </CardInfoPanelText>
            ) : null}
            {clinicProposedChange ? (
              <>
                <OnboardingButton label="Accept new time" onPress={handleAcceptProposal} />
                <OnboardingButton
                  label="Decline"
                  variant="destructive"
                  onPress={handleDeclineProposal}
                />
              </>
            ) : (
              <>
                <OnboardingButton label="Add to calendar" onPress={handleAddInterviewToCalendar} />
                {!workerProposedChange ? (
                  <OnboardingButton
                    label="Request new time"
                    variant="secondary"
                    onPress={() => setRescheduleVisible(true)}
                  />
                ) : null}
                <OnboardingButton
                  label="Cancel interview"
                  variant="destructive"
                  onPress={handleCancelScheduledInterview}
                />
              </>
            )}
          </CardInfoPanel>
        ) : null}

        {awaitingKit ? (
          <WorkerApplicationKitSubmission
            applicationId={application.id}
            clinicName={application.clinic_name}
            postTitle={application.post_title}
            onSubmitted={onUpdated}
          />
        ) : null}

        <CardDetailSection
          title={
            isScreeningStage && !hasKitSubmitted
              ? 'Your screening submission'
              : 'What you submitted'
          }
          divided={variant === 'embedded'}>
          <View style={styles.submittedWrap}>
            {hasKitSubmitted ? (
              <ApplicationSubmittedFields
                application={application}
                screening={
                  application.post_type === 'job' ? application.screening : undefined
                }
              />
            ) : null}
            {!hasKitSubmitted &&
            application.post_type === 'job' &&
            application.screening ? (
              <ApplicationScreeningPreview
                screening={application.screening}
                audience="worker"
                defaultExpanded={false}
              />
            ) : null}
            {isScreeningStage && !hasKitSubmitted && !application.screening ? (
              <ApplicationPreviewGroup>
                <Text style={styles.mutedText}>Screening responses submitted.</Text>
              </ApplicationPreviewGroup>
            ) : null}
            {hasKitSubmitted && application.cover_message ? (
              <ApplicationPreviewGroup title="Cover message">
                <DetailProse text={application.cover_message} />
              </ApplicationPreviewGroup>
            ) : null}
          </View>
        </CardDetailSection>

        {hasActions ? (
          <CardDetailSection title="Actions" divided>
            <View style={styles.actionsGrid}>
              {actionRows.map((slots, rowIndex) => (
                <View key={`action-row-${rowIndex}`} style={styles.actionsRow}>
                  {slots.map((slot) => (
                    <View key={slot.key} style={styles.actionCell}>
                      <OnboardingButton
                        label={slot.label}
                        variant={slot.variant}
                        onPress={slot.onPress}
                        disabled={slot.disabled}
                      />
                    </View>
                  ))}
                </View>
              ))}
            </View>
          </CardDetailSection>
        ) : null}
      </View>

      {rescheduleVisible ? (
        <InterviewScheduleSheet
          visible
          application={application as unknown as ClinicApplication}
          clinicName={application.clinic_name}
          mode="propose_reschedule"
          titleOverride="Request new time"
          subtitleOverride="The confirmed interview stays until the clinic accepts your proposed time."
          submitLabelOverride="Send request"
          onSubmit={async (input) => {
            await proposeApplicationInterviewUpdateAsWorker(
              application.worker_id,
              application.id,
              input,
            );
          }}
          onSaved={() => {
            setRescheduleVisible(false);
            onUpdated?.();
          }}
          onClose={() => setRescheduleVisible(false)}
        />
      ) : null}
    </>
  );

  if (variant === 'embedded') {
    return bodyContent;
  }

  const heroHeader = (
    <ClinicPostHeader
      clinicName={application.clinic_name}
      logoStoragePath={application.clinic_logo_storage_path}
      title={application.post_title}
      location={clinicLocation}
      accessory={
        jobMatch && matchContext ? (
          <MatchTierBadge
            breakdown={jobMatch}
            context={matchContext}
            subtitle={application.post_title}
          />
        ) : null
      }
      footer={
        <>
          <View style={styles.statusRow}>
            <Text style={styles.metaLabel}>Status</Text>
            <WorkerApplicationStatusBadge
              status={application.status}
              postType={application.post_type}
            />
          </View>
          {formatAppliedLabel(application) ? (
            <Text style={styles.appliedDate}>{formatAppliedLabel(application)}</Text>
          ) : null}
        </>
      }
    />
  );

  return (
    <SurfaceCard padding="none" gap>
      <View style={{ padding: spacing.lg }}>
        {heroHeader}
      </View>
      <CardSectionDivider />
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: spacing.lg }}>
        {bodyContent}
      </View>
    </SurfaceCard>
  );
}
