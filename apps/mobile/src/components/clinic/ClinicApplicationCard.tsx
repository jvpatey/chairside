import {
  acceptApplicationInterviewUpdate,
  cancelApplicationInterviewOffer,
  cancelScheduledApplicationInterview,
  declineApplicationInterviewUpdate,
  getApplicantDisplayName,
  requestApplicationKit,
  updateApplicationStatus,
  type ClinicApplication,
} from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  formatInterviewDateTime,
  hasApplicationKitSubmitted,
  hasPendingInterviewProposal,
  canClinicHideApplication,
  isAwaitingApplicationKit,
  isScreeningStageStatus,
  formatRoleTypesLabel,
  resolveWorkerRoleTypes,
  getSpecialtyLabel,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import {
  Children,
  cloneElement,
  isValidElement,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import {
  Alert,
  LayoutAnimation,
  Platform,
  Text,
  UIManager,
  View,
  type ViewStyle,
} from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { ApplicationScreeningSection } from '@/components/clinic/ApplicationScreeningSection';
import { ApplicationPreviewField } from '@/components/worker/ApplicationPackageFields';
import type { InterviewScheduleSheetMode } from '@/components/clinic/InterviewScheduleSheet';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardExpandToggle } from '@/components/ui/CardExpandToggle';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import {
  buildInterviewInviteInputFromApplication,
  openInterviewCalendarInvite,
} from '@/lib/calendarInvite';
import { buildResumeFileName } from '@/lib/openResumePreview';
import {
  getClinicApplicationMessagesRoute,
  type ClinicApplicationReturnTarget,
} from '@/lib/routing';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { useTheme, useThemedStyles } from '@/theme';
import { confirmHideClinicApplication } from '@/lib/clinicApplicationHide';
import { IS_WEB, webTileHoverStyles } from '@/lib/webPressableStyles';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ClinicApplicationCardProps = {
  application: ClinicApplication;
  clinicId?: string;
  returnTo?: ClinicApplicationReturnTarget;
  hasUnreadMessages?: boolean;
  onUpdated?: () => void;
  onShortlisted?: () => void;
  onScheduleInterview?: (
    application: ClinicApplication,
    mode?: InterviewScheduleSheetMode,
  ) => void;
  onHired?: (application: ClinicApplication) => void;
  onRemoved?: () => void;
  onDecided?: () => void;
};

function ApplicationActionRow({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(({ spacing }) => ({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignSelf: 'stretch',
      alignItems: 'stretch',
    },
    cell: {
      flex: 1,
      minWidth: 0,
    },
  }));

  const items = Children.toArray(children).filter((child) => child != null && child !== false);
  if (items.length === 0) return null;

  return (
    <View style={styles.row}>
      {items.map((child, index) => (
        <View key={index} style={styles.cell}>
          {isValidElement(child)
            ? cloneElement(child as ReactElement<{ style?: ViewStyle }>, {
                style: [
                  (child as ReactElement<{ style?: ViewStyle }>).props.style,
                  { flex: 1 },
                ],
              })
            : child}
        </View>
      ))}
    </View>
  );
}

function truncatePreview(text: string, maxLength = 88): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

export function ClinicApplicationCard({
  application,
  clinicId,
  returnTo = 'applications-tab',
  hasUnreadMessages = false,
  onUpdated,
  onShortlisted,
  onScheduleInterview,
  onHired,
  onRemoved,
  onDecided,
}: ClinicApplicationCardProps) {
  const { colors } = useTheme();
  const [cardHovered, setCardHovered] = useState(false);
  const {
    refreshPending: refreshApplicationTabBadge,
    markApplicationSeen,
    isApplicationHighlighted,
    getApplicationHighlightLabel,
  } = useApplicationTabBadge();
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const [expanded, setExpanded] = useState(false);
  const isJob = application.post_type === 'job';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const interviewSummary = formatInterviewDateTime(
    application.interview_at,
    application.interview_duration_minutes,
  );
  const proposedSummary = formatInterviewDateTime(
    application.interview_proposed_at,
    application.interview_proposed_duration_minutes,
  );
  const pendingProposal = hasPendingInterviewProposal(application);
  const workerProposedChange =
    pendingProposal && application.interview_proposed_by === 'worker';
  const clinicProposedChange =
    pendingProposal && application.interview_proposed_by === 'clinic';
  const hasNewApplication = isApplicationHighlighted(application);
  const newApplicationLabel = getApplicationHighlightLabel(application);

  const styles = useThemedStyles(({ colors, spacing, typography, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    preview: {
      ...typography.subtitle,
      fontStyle: 'italic',
    },
    interviewRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    interviewText: {
      ...typography.subtitle,
      flex: 1,
      fontSize: 14,
    },
    details: {
      gap: spacing.sm,
    },
    actions: {
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    action: {
      flex: 1,
      minWidth: 0,
    },
    deletedBanner: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    deletedText: {
      ...typography.subtitle,
      fontSize: 14,
    },
    pendingKitBanner: {
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 10,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    pendingKitText: {
      ...typography.subtitle,
      fontSize: 14,
    },
  }));

  const updateStatus = async (status: Parameters<typeof updateApplicationStatus>[1]) => {
    try {
      await updateApplicationStatus(application.id, status);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await refreshApplicationTabBadge();
      if (status === 'selected') {
        onHired?.(application);
      }
      if (status === 'rejected') {
        onDecided?.();
      }
      if (status === 'in_progress') {
        (onShortlisted ?? onUpdated)?.();
      } else {
        onUpdated?.();
      }
    } catch (error) {
      Alert.alert(
        'Update failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleAddInterviewToCalendar = () => {
    const inviteInput = buildInterviewInviteInputFromApplication({
      clinicName,
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

  const cancelScheduledInterview = () => {
    showConfirmActionSheet({
      title: 'Cancel interview?',
      message: 'This returns the applicant to your shortlist. You can reschedule or continue messaging.',
      confirmLabel: 'Cancel interview',
      destructive: true,
      onConfirm: async () => {
        try {
          await cancelScheduledApplicationInterview(application.id, 'clinic');
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          (onShortlisted ?? onUpdated)?.();
        } catch (error) {
          Alert.alert(
            'Update failed',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const acceptWorkerProposal = () => {
    showConfirmActionSheet({
      title: 'Accept new time?',
      message: 'The confirmed interview will move to the proposed time.',
      confirmLabel: 'Accept',
      onConfirm: async () => {
        try {
          await acceptApplicationInterviewUpdate(application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Update failed',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const declineWorkerProposal = () => {
    showConfirmActionSheet({
      title: 'Decline new time?',
      message: 'The confirmed interview time will stay as scheduled.',
      confirmLabel: 'Decline',
      destructive: true,
      onConfirm: async () => {
        try {
          await declineApplicationInterviewUpdate(application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onUpdated?.();
        } catch (error) {
          Alert.alert(
            'Update failed',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const cancelInterviewInvite = () => {
    showConfirmActionSheet({
      title: 'Cancel interview invite?',
      message: 'This withdraws the invitation and moves the applicant back to your shortlist.',
      confirmLabel: 'Cancel invite',
      destructive: true,
      onConfirm: async () => {
        try {
          await cancelApplicationInterviewOffer(application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          (onShortlisted ?? onUpdated)?.();
        } catch (error) {
          Alert.alert(
            'Update failed',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!expanded && hasNewApplication) {
      void markApplicationSeen(application.id);
    }
    setExpanded((current) => !current);
  };

  const resumeFileName = buildResumeFileName({
    workerDisplayName: application.worker_display_name,
    postTitle: application.post_title,
  });

  const hasInterviewDetails =
    (application.status === 'interview_offered' ||
      application.status === 'interview_scheduled') &&
    interviewSummary;

  const hasKitSubmitted = hasApplicationKitSubmitted(application);
  const isScreeningStage = isScreeningStageStatus(application.status);
  const awaitingKit = isAwaitingApplicationKit(application);

  const requestKit = async () => {
    try {
      await requestApplicationKit(application.id);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onUpdated?.();
    } catch (error) {
      Alert.alert(
        'Request failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    }
  };

  const handleRequestKit = () => {
    showConfirmActionSheet({
      title: 'Request application kit?',
      message:
        'The candidate will be asked to confirm and submit their full application before you can review it.',
      confirmLabel: 'Request application',
      onConfirm: () => requestKit(),
    });
  };

  const hasActions =
    !application.worker_account_deleted &&
    (isScreeningStage ||
      application.status === 'applied' ||
      application.status === 'reviewed' ||
      application.status === 'in_progress' ||
      application.status === 'interview_offered' ||
      application.status === 'interview_scheduled');

  const applicantName = getApplicantDisplayName(application);
  const workerDeleted = application.worker_account_deleted;

  const canRemoveFromList = Boolean(clinicId) && canClinicHideApplication(application);

  const handleMessage = () => {
    router.push(getClinicApplicationMessagesRoute(application.id, returnTo));
  };

  const cardHoverProps = IS_WEB
    ? {
        onMouseEnter: () => setCardHovered(true),
        onMouseLeave: () => setCardHovered(false),
      }
    : {};

  return (
    <View style={[styles.card, IS_WEB && cardHovered && styles.cardHovered]} {...cardHoverProps}>
      <ApplicantPostHeader
        displayName={applicantName}
        photoStoragePath={workerDeleted ? null : application.worker_photo_storage_path}
        title={application.post_title}
        detail={
          workerDeleted
            ? null
            : [application.worker_address, newApplicationLabel].filter(Boolean).join(' · ') || null
        }
        avatarSize={44}
        accessory={
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {hasNewApplication ? <ApplicationCardBadge /> : null}
            <ClinicApplicationStatusBadge
              status={application.status}
              postType={application.post_type}
              applicationKitRequestedAt={application.application_kit_requested_at}
              applicationKitSubmittedAt={application.application_kit_submitted_at}
            />
          </View>
        }
        textFooter={
          jobMatch && matchContext ? (
            <BadgeRow>
              <MatchTierBadge
                breakdown={jobMatch}
                context={matchContext}
                subtitle={application.post_title}
                audience="clinic"
              />
            </BadgeRow>
          ) : null
        }
      />

      {hasInterviewDetails ? (
        <View style={styles.interviewRow}>
          <Ionicons
            name="calendar-outline"
            size={16}
            color={application.status === 'interview_offered' ? colors.warning : colors.info}
          />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.interviewText}>{interviewSummary}</Text>
            {application.status === 'interview_offered' ? (
              <Text style={[styles.interviewText, { fontSize: 13 }]}>
                Awaiting candidate response
              </Text>
            ) : null}
            {application.status === 'interview_scheduled' && clinicProposedChange ? (
              <Text style={[styles.interviewText, { fontSize: 13 }]}>
                Awaiting candidate response to new time
                {proposedSummary ? ` · ${proposedSummary}` : ''}
              </Text>
            ) : null}
            {application.status === 'interview_scheduled' && workerProposedChange && proposedSummary ? (
              <Text style={[styles.interviewText, { fontSize: 13 }]}>
                Proposed new time · {proposedSummary}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}

      {awaitingKit ? (
        <View style={styles.pendingKitBanner}>
          <Text style={styles.pendingKitText}>
            Application kit requested. Waiting for the candidate to submit.
          </Text>
        </View>
      ) : null}

      {workerDeleted ? (
        <View style={styles.deletedBanner}>
          <Text style={styles.deletedText}>
            This candidate is no longer signed up for Chairside.
          </Text>
        </View>
      ) : null}

      <OnboardingButton
        label={
          workerDeleted
            ? 'View messages'
            : hasUnreadMessages
              ? 'Message applicant · New'
              : 'Message applicant'
        }
        variant="secondary"
        onPress={handleMessage}
      />

      {canRemoveFromList && clinicId ? (
        <OnboardingButton
          label="Remove from list"
          variant="secondary"
          onPress={() =>
            confirmHideClinicApplication(clinicId, application, () => onRemoved?.())
          }
        />
      ) : null}

      {!expanded && application.cover_message ? (
        <Text style={styles.preview} numberOfLines={2}>
          {truncatePreview(application.cover_message)}
        </Text>
      ) : null}

      <CardExpandToggle expanded={expanded} onPress={toggleExpanded} suppressHover />

      {expanded ? (
        <View style={styles.details}>
          {application.post_type === 'job' && application.screening ? (
            <ApplicationScreeningSection screening={application.screening} />
          ) : null}
          {hasKitSubmitted && application.years_of_experience != null ? (
            <ApplicationPreviewField
              label="Experience"
              value={`${application.years_of_experience} years`}
            />
          ) : null}
          {hasKitSubmitted && formatApplicationEducation(application.education) ? (
            <ApplicationPreviewField
              label="Education"
              value={formatApplicationEducation(application.education)}
            />
          ) : null}
          {hasKitSubmitted && resolveWorkerRoleTypes(application).length > 0 ? (
            <ApplicationPreviewField
              label="Roles"
              value={formatRoleTypesLabel(resolveWorkerRoleTypes(application))}
            />
          ) : null}
          {hasKitSubmitted && (application.software_used ?? []).length > 0 ? (
            <ApplicationPreviewField
              label="Software"
              value={(application.software_used ?? []).join(', ')}
            />
          ) : null}
          {hasKitSubmitted && (application.practice_types ?? []).length > 0 ? (
            <ApplicationPreviewField
              label="Specialties"
              value={(application.practice_types ?? []).map(getSpecialtyLabel).join(', ')}
            />
          ) : null}
          {hasKitSubmitted && application.cover_message ? (
            <ApplicationPreviewField label="Cover message" value={application.cover_message} />
          ) : null}
          {isScreeningStage && !hasKitSubmitted ? (
            <ApplicationPreviewField
              label="Application kit"
              value="Not submitted yet"
            />
          ) : null}
          {application.interview_details ? (
            <ApplicationPreviewField
              label="Interview details"
              value={application.interview_details}
            />
          ) : null}
          {hasKitSubmitted ? (
            <>
              <ApplicationPreviewField
                label="Resume"
                value={formatApplicationResumeStatus(application.resume_storage_path)}
              />
              {application.resume_storage_path ? (
                <ResumeViewButton
                  storagePath={application.resume_storage_path}
                  fileName={resumeFileName}
                />
              ) : null}
            </>
          ) : null}

          {hasActions ? (
            <View style={styles.actions}>
              {isScreeningStage && !awaitingKit ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Request application kit"
                    onPress={handleRequestKit}
                  />
                  <OnboardingButton
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'applied' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Mark viewed"
                    onPress={() => void updateStatus('reviewed')}
                  />
                  <OnboardingButton
                    label="Add to shortlist"
                    variant="secondary"
                    onPress={() => void updateStatus('in_progress')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'applied' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'reviewed' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Add to shortlist"
                    onPress={() => void updateStatus('in_progress')}
                  />
                  <OnboardingButton
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'in_progress' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Schedule interview"
                    onPress={() => onScheduleInterview?.(application, 'offer')}
                  />
                  <OnboardingButton
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'interview_offered' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Edit invite"
                    variant="secondary"
                    onPress={() => onScheduleInterview?.(application, 'edit_offer')}
                  />
                  <OnboardingButton
                    label="Cancel invite"
                    variant="secondary"
                    onPress={cancelInterviewInvite}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'interview_offered' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'interview_scheduled' && workerProposedChange ? (
                <ApplicationActionRow>
                  <OnboardingButton label="Accept new time" onPress={acceptWorkerProposal} />
                  <OnboardingButton
                    label="Decline"
                    variant="destructive"
                    onPress={declineWorkerProposal}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'interview_scheduled' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Add to calendar"
                    variant="secondary"
                    onPress={handleAddInterviewToCalendar}
                  />
                  {!clinicProposedChange && !workerProposedChange ? (
                    <OnboardingButton
                      label="Reschedule"
                      variant="secondary"
                      onPress={() => onScheduleInterview?.(application, 'propose_reschedule')}
                    />
                  ) : null}
                </ApplicationActionRow>
              ) : null}
              {application.status === 'interview_scheduled' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Cancel interview"
                    variant="secondary"
                    onPress={cancelScheduledInterview}
                  />
                  <OnboardingButton
                    label="Mark hired"
                    onPress={() => void updateStatus('selected')}
                  />
                </ApplicationActionRow>
              ) : null}
              {application.status === 'interview_scheduled' ? (
                <ApplicationActionRow>
                  <OnboardingButton
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </ApplicationActionRow>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
