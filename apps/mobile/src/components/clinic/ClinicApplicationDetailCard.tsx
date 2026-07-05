import {
  acceptApplicationInterviewUpdate,
  cancelApplicationInterviewOffer,
  cancelScheduledApplicationInterview,
  confirmFillInApplicant,
  declineApplicationInterviewUpdate,
  FILL_IN_PENDING_STATUSES,
  getApplicantDisplayName,
  requestApplicationKit,
  updateApplicationStatus,
  type ClinicApplication,
} from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  formatApplicationDate,
  formatInterviewDateTime,
  hasApplicationKitSubmitted,
  hasPendingInterviewProposal,
  canClinicHideApplication,
  isAwaitingApplicationKit,
  isScreeningStageStatus,
  formatRoleTypesLabel,
  resolveWorkerRoleTypes,
  getSpecialtyLabel,
  getRoleTypeLabel,
} from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Children,
  cloneElement,
  isValidElement,
  useEffect,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Alert, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { ApplicationStatusSummaryCard } from '@/components/matching/ApplicationStatusSummaryCard';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import {
  ClinicWorkerCrmSection,
  ClinicWorkerCrmSheet,
} from '@/components/clinic/ClinicWorkerCrmSheet';
import { ApplicationPdfPacketPreviewModal } from '@/components/clinic/ApplicationPdfPacketPreviewModal';
import { ApplicationScreeningSection } from '@/components/clinic/ApplicationScreeningSection';
import { ApplicationPreviewField } from '@/components/worker/ApplicationPackageFields';
import type { InterviewScheduleSheetMode } from '@/components/clinic/InterviewScheduleSheet';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { cardShellRadii } from '@/components/ui/cardLayout';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useDismissedScreeningReviews } from '@/hooks/useDismissedScreeningReviews';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
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
  canGenerateApplicationPdfPacket,
  generateApplicationPdfPacket,
  type ApplicationPdfPacketResult,
} from '@/lib/applicationPdfPacket';
import { getClinicCalendarRoute } from '@/lib/calendarNavigation';
import {
  getClinicApplicationMessagesRoute,
  type ClinicApplicationReturnTarget,
} from '@/lib/routing';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { confirmHideClinicApplication } from '@/lib/clinicApplicationHide';
import { getClinicApplicantBadgeVisibility } from '@/lib/applicationPipeline';
import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

function useBrandColors(accent: GradientAccent) {
  const { colors } = useTheme();
  return {
    brand: accent === 'secondary' ? colors.secondary : colors.primary,
    brandSubtle: accent === 'secondary' ? colors.secondarySubtle : colors.primarySubtle,
  };
}

type ClinicApplicationDetailCardProps = {
  application: ClinicApplication;
  clinicId: string;
  returnTo?: ClinicApplicationReturnTarget;
  hasUnreadMessages?: boolean;
  onUpdated?: () => void;
  onShortlisted?: () => void;
  onScheduleInterview?: (
    application: ClinicApplication,
    mode?: InterviewScheduleSheetMode,
  ) => void;
  onHired?: (application: ClinicApplication) => void;
  onConfirmed?: (payload: HiringCelebrationPayload) => void;
  onRemoved?: () => void;
  onDecided?: () => void;
};

type ActionButtonSpec = {
  key: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  onPress: () => void;
  disabled?: boolean;
};

type SectionIcon = React.ComponentProps<typeof Ionicons>['name'];

function ApplicantDetailSection({
  icon,
  title,
  children,
  accent = 'primary',
  headerAccessory,
}: {
  icon: SectionIcon;
  title: string;
  children: ReactNode;
  accent?: GradientAccent;
  headerAccessory?: ReactNode;
}) {
  const { brand, brandSubtle } = useBrandColors(accent);
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    section: {
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      ...typography.label,
      fontFamily: fontSemibold,
      fontSize: 13,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      flex: 1,
    },
    body: {
      gap: spacing.sm,
    },
  }));

  return (
    <View style={styles.section}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: brandSubtle }]}>
          <Ionicons name={icon} size={15} color={brand} />
        </View>
        <Text style={styles.title}>{title}</Text>
        {headerAccessory}
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

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
      alignSelf: 'stretch',
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

function ApplicationActionButtons({
  actions,
  accent = 'primary',
}: {
  actions: ActionButtonSpec[];
  accent?: GradientAccent;
}) {
  if (actions.length === 0) return null;

  const chunks: ActionButtonSpec[][] = [];
  for (let index = 0; index < actions.length; index += 2) {
    chunks.push(actions.slice(index, index + 2));
  }

  return (
    <>
      {chunks.map((chunk) =>
        chunk.length === 1 ? (
          <OnboardingButton
            key={chunk[0].key}
            label={chunk[0].label}
            variant={chunk[0].variant ?? 'primary'}
            accent={accent}
            onPress={chunk[0].onPress}
            disabled={chunk[0].disabled}
          />
        ) : (
          <ApplicationActionRow key={chunk.map((action) => action.key).join('-')}>
            {chunk.map((action) => (
              <OnboardingButton
                key={action.key}
                label={action.label}
                variant={action.variant ?? 'primary'}
                accent={accent}
                onPress={action.onPress}
                disabled={action.disabled}
                split
              />
            ))}
          </ApplicationActionRow>
        ),
      )}
    </>
  );
}

function ApplicantHeroCard({
  application,
  applicantName,
  workerDeleted,
  experienceLabel,
  appliedLabel,
  showNewBadge,
  showStatusBadge,
  jobMatch,
  matchContext,
  accent = 'primary',
}: {
  application: ClinicApplication;
  applicantName: string;
  workerDeleted: boolean;
  experienceLabel: string | null;
  appliedLabel: string | null;
  showNewBadge: boolean;
  showStatusBadge: boolean;
  jobMatch: ReturnType<typeof parseApplicationJobMatch>;
  matchContext: ReturnType<typeof getApplicationMatchDisplayContext>;
  accent?: GradientAccent;
}) {
  const photoUri = useWorkerPhotoUri(
    workerDeleted ? null : application.worker_photo_storage_path,
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    name: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      color: colors.labelPrimary,
    },
    metaLine: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    badgeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: spacing.sm,
    },
  }));

  const metaParts = [
    workerDeleted ? null : application.worker_address?.trim(),
    experienceLabel,
    appliedLabel,
  ].filter(Boolean);

  return (
    <SurfaceCard padding="md" gap>
      <View style={styles.wrap}>
        <View style={styles.topRow}>
          <WorkerProfileAvatar displayName={applicantName} photoUri={photoUri} size={56} />
          <View style={styles.identity}>
            <Text style={styles.name} numberOfLines={2}>
              {applicantName}
            </Text>
            {metaParts.length > 0 ? (
              <Text style={styles.metaLine} numberOfLines={3}>
                {metaParts.join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.badgeRow}>
          {showNewBadge ? <ApplicationCardBadge accent={accent} /> : null}
          {showStatusBadge ? (
            <ClinicApplicationStatusBadge
              status={application.status}
              postType={application.post_type}
              applicationKitRequestedAt={application.application_kit_requested_at}
              applicationKitSubmittedAt={application.application_kit_submitted_at}
            />
          ) : null}
          {jobMatch && matchContext ? (
            <MatchTierBadge
              breakdown={jobMatch}
              context={matchContext}
              subtitle={application.post_title}
              audience="clinic"
            />
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

function ApplicantQualificationsGrid({
  application,
}: {
  application: ClinicApplication;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    item: {
      width: '48%',
      flexGrow: 1,
      backgroundColor: colors.fillSubtle,
      borderRadius: cardShellRadii.inner,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.sm,
      gap: 2,
      minWidth: 140,
    },
    label: {
      fontSize: 11,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    value: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 21,
      color: colors.labelPrimary,
    },
  }));

  const items: { label: string; value: string }[] = [];

  if (application.years_of_experience != null) {
    items.push({
      label: 'Experience',
      value: `${application.years_of_experience} ${
        application.years_of_experience === 1 ? 'year' : 'years'
      }`,
    });
  }

  const education = formatApplicationEducation(application.education);
  if (education) {
    items.push({ label: 'Education', value: education });
  }

  const roles = formatRoleTypesLabel(resolveWorkerRoleTypes(application));
  if (roles) {
    items.push({ label: 'Roles', value: roles });
  }

  if ((application.software_used ?? []).length > 0) {
    items.push({
      label: 'Software',
      value: (application.software_used ?? []).join(', '),
    });
  }

  if ((application.practice_types ?? []).length > 0) {
    items.push({
      label: 'Specialties',
      value: (application.practice_types ?? []).map(getSpecialtyLabel).join(', '),
    });
  }

  if (items.length === 0) return null;

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <Text style={styles.label}>{item.label}</Text>
          <Text style={styles.value}>{item.value}</Text>
        </View>
      ))}
    </View>
  );
}

function ApplicationSummaryCard({
  coverMessage,
  kitSubmitted,
  isScreeningStage,
  appliedLabel,
  accent = 'primary',
}: {
  coverMessage?: string | null;
  kitSubmitted: boolean;
  isScreeningStage: boolean;
  appliedLabel: string | null;
  accent?: GradientAccent;
}) {
  const { brand } = useBrandColors(accent);
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    quote: {
      backgroundColor: colors.fillSubtle,
      borderRadius: cardShellRadii.inner,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderLeftWidth: 3,
      gap: spacing.xs,
    },
    quoteLabel: {
      fontSize: 11,
      fontFamily: fontSemibold,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelTertiary,
    },
    quoteText: {
      ...typography.body,
      fontSize: 15,
      lineHeight: 22,
      color: colors.labelPrimary,
      fontStyle: 'italic',
    },
    metaList: {
      gap: spacing.xs,
    },
  }));

  const hasContent =
    coverMessage?.trim() ||
    appliedLabel ||
    (isScreeningStage && !kitSubmitted) ||
    kitSubmitted;

  if (!hasContent) return null;

  return (
    <SurfaceCard padding="md" gap>
      <ApplicantDetailSection
        icon="document-text-outline"
        title="Application summary"
        accent={accent}>
        <View style={styles.metaList}>
          {appliedLabel ? (
            <ApplicationPreviewField label="Submitted" value={appliedLabel} preserveLabelCase />
          ) : null}
          {isScreeningStage && !kitSubmitted ? (
            <ApplicationPreviewField
              label="Candidate packet"
              value="Not submitted yet"
              preserveLabelCase
            />
          ) : null}
          {kitSubmitted ? (
            <ApplicationPreviewField
              label="Candidate packet"
              value="Submitted"
              preserveLabelCase
            />
          ) : null}
        </View>
        {coverMessage?.trim() ? (
          <View style={[styles.quote, { borderLeftColor: brand }]}>
            <Text style={styles.quoteLabel}>Cover message</Text>
            <Text style={styles.quoteText}>{coverMessage.trim()}</Text>
          </View>
        ) : null}
      </ApplicantDetailSection>
    </SurfaceCard>
  );
}

function ActionPanel({
  primary,
  secondary,
  destructive,
  messageAction,
  summaryAction,
  removeAction,
  accent = 'primary',
}: {
  primary: ActionButtonSpec[];
  secondary: ActionButtonSpec[];
  destructive: ActionButtonSpec[];
  messageAction: ActionButtonSpec;
  summaryAction?: ActionButtonSpec | null;
  removeAction: ActionButtonSpec | null;
  accent?: GradientAccent;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    actionStack: {
      gap: spacing.sm,
      alignSelf: 'stretch',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
  }));

  const workflowActions = [
    ...primary,
    ...secondary.map((action) => ({ ...action, variant: action.variant ?? 'secondary' })),
    ...destructive.map((action) => ({ ...action, variant: action.variant ?? 'destructive' })),
  ];
  const hasWorkflow = workflowActions.length > 0;

  return (
    <SurfaceCard padding="md">
      <View style={styles.actionStack}>
        {hasWorkflow ? <ApplicationActionButtons actions={workflowActions} accent={accent} /> : null}
        {hasWorkflow ? <View style={styles.divider} /> : null}
        {summaryAction ? (
          <OnboardingButton
            label={summaryAction.label}
            variant="secondary"
            accent={accent}
            disabled={summaryAction.disabled}
            onPress={summaryAction.onPress}
          />
        ) : null}
        <OnboardingButton
          label={messageAction.label}
          accent={accent}
          solid
          onPress={messageAction.onPress}
        />
        {removeAction ? (
          <OnboardingButton
            label={removeAction.label}
            variant="ghost"
            accent={accent}
            onPress={removeAction.onPress}
          />
        ) : null}
      </View>
    </SurfaceCard>
  );
}

export function ClinicApplicationDetailCard({
  application,
  clinicId,
  returnTo = 'applications-tab',
  hasUnreadMessages = false,
  onUpdated,
  onShortlisted,
  onScheduleInterview,
  onHired,
  onConfirmed,
  onRemoved,
  onDecided,
}: ClinicApplicationDetailCardProps) {
  const {
    refreshPending: refreshApplicationTabBadge,
    markApplicationSeen,
    isApplicationHighlighted,
  } = useApplicationTabBadge();
  const { clinicProfile } = useClinicProfile();
  const clinicName = clinicProfile?.clinic_name?.trim() || 'Your clinic';
  const [crmSheetVisible, setCrmSheetVisible] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<ApplicationPdfPacketResult | null>(null);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  const { isHydrated: screeningDismissHydrated, dismissedIds: dismissedScreeningReviewIds, dismiss: dismissScreeningReviewBadge } =
    useDismissedScreeningReviews();
  const isJob = application.post_type === 'job';
  const accent: GradientAccent = isJob ? 'primary' : 'secondary';
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

  useEffect(() => {
    if (hasNewApplication) {
      void markApplicationSeen(application.id);
    }
  }, [application.id, hasNewApplication, markApplicationSeen]);

  const styles = useThemedStyles(({ spacing }) => ({
    stack: {
      gap: spacing.lg,
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
      title: 'Request full application?',
      message:
        'After reviewing their screening responses, you can request the candidate packet. They will submit their resume, profile, and cover note before you can review the full application.',
      confirmLabel: 'Request full application',
      onConfirm: () => requestKit(),
    });
  };

  const applicantName = getApplicantDisplayName(application);
  const workerDeleted = application.worker_account_deleted;

  const hasActions =
    !workerDeleted &&
    (isScreeningStage ||
      application.status === 'applied' ||
      application.status === 'reviewed' ||
      application.status === 'in_progress' ||
      application.status === 'interview_offered' ||
      application.status === 'interview_scheduled');

  const isFillInPending =
    application.post_type === 'shift' &&
    FILL_IN_PENDING_STATUSES.includes(application.status) &&
    !workerDeleted;

  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} ${
          application.years_of_experience === 1 ? 'year' : 'years'
        } experience`
      : null;
  const appliedDateLabel = formatApplicationDate(application.created_at);
  const appliedLabel = appliedDateLabel ? `Applied ${appliedDateLabel}` : null;

  const canRemoveFromList = canClinicHideApplication(application);
  const canManageCrm = !workerDeleted;
  const crmRecord = application.clinic_crm;

  const handleMessage = () => {
    router.push(getClinicApplicationMessagesRoute(application.id, returnTo));
  };

  const handleOpenCandidatePacket = async () => {
    if (!canGenerateApplicationPdfPacket(application) || isGeneratingPdf) return;

    setIsGeneratingPdf(true);
    setPdfPreviewError(null);
    try {
      const result = await generateApplicationPdfPacket({
        application,
        clinicName,
      });
      setPdfPreview(result);
      setPdfPreviewVisible(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (result.resumeMergeWarning) {
        Alert.alert('Candidate packet ready', result.resumeMergeWarning);
      }
    } catch (error) {
      setPdfPreview(null);
      setPdfPreviewError(
        error instanceof Error ? error.message : 'Could not create candidate packet.',
      );
      setPdfPreviewVisible(true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleAcceptFillIn = () => {
    showConfirmActionSheet({
      title: 'Accept cover request?',
      message: `Confirm ${applicantName} for this fill-in? Other pending requests will be declined and the shift will be marked filled.`,
      confirmLabel: 'Accept',
      onConfirm: async () => {
        try {
          await confirmFillInApplicant(clinicId, application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onConfirmed?.({
            applicationId: application.id,
            postType: 'shift',
            audience: 'clinic',
            counterpartName: applicantName,
            postTitle: getRoleTypeLabel(application.post_role_type),
            shiftDateLabel: application.post_title.replace(/^Fill-in · /, ''),
          });
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

  const showNewBadge = hasNewApplication;
  const { showStatusBadge } = getClinicApplicantBadgeVisibility(application, hasNewApplication);

  const rejectAction = (): ActionButtonSpec => ({
    key: 'reject',
    label: 'Not moving forward',
    variant: 'secondary',
    onPress: () => void updateStatus('rejected'),
  });

  const buildWorkflowActions = (): {
    primary: ActionButtonSpec[];
    secondary: ActionButtonSpec[];
    destructive: ActionButtonSpec[];
  } => {
    const primary: ActionButtonSpec[] = [];
    const secondary: ActionButtonSpec[] = [];
    const destructive: ActionButtonSpec[] = [];

    if (!hasActions) {
      return { primary, secondary, destructive };
    }

    if (isFillInPending) {
      primary.push({
        key: 'accept-fill-in',
        label: 'Accept cover',
        onPress: handleAcceptFillIn,
      });
      destructive.push({
        key: 'decline-fill-in',
        label: 'Decline cover request',
        variant: 'secondary',
        onPress: () => void updateStatus('rejected'),
      });
      return { primary, secondary, destructive };
    }

    if (isScreeningStage && !awaitingKit) {
      primary.push({
        key: 'request-kit',
        label: 'Request full application',
        onPress: handleRequestKit,
      });
      destructive.push(rejectAction());
      return { primary, secondary, destructive };
    }

    if (application.status === 'applied') {
      primary.push({
        key: 'mark-viewed',
        label: 'Mark viewed',
        variant: 'secondary',
        onPress: () => void updateStatus('reviewed'),
      });
      secondary.push({
        key: 'shortlist',
        label: 'Add to shortlist',
        onPress: () => void updateStatus('in_progress'),
      });
      destructive.push(rejectAction());
      return { primary, secondary, destructive };
    }

    if (application.status === 'reviewed') {
      primary.push({
        key: 'shortlist',
        label: 'Add to shortlist',
        onPress: () => void updateStatus('in_progress'),
      });
      destructive.push(rejectAction());
      return { primary, secondary, destructive };
    }

    if (application.status === 'in_progress') {
      primary.push({
        key: 'schedule',
        label: 'Schedule interview',
        onPress: () => onScheduleInterview?.(application, 'offer'),
      });
      destructive.push(rejectAction());
      return { primary, secondary, destructive };
    }

    if (application.status === 'interview_offered') {
      primary.push(
        {
          key: 'edit-invite',
          label: 'Edit invite',
          variant: 'secondary',
          onPress: () => onScheduleInterview?.(application, 'edit_offer'),
        },
        {
          key: 'cancel-invite',
          label: 'Cancel invite',
          variant: 'secondary',
          onPress: cancelInterviewInvite,
        },
      );
      destructive.push(rejectAction());
      return { primary, secondary, destructive };
    }

    if (application.status === 'interview_scheduled') {
      if (workerProposedChange) {
        primary.push({
          key: 'accept-time',
          label: 'Accept new time',
          onPress: acceptWorkerProposal,
        });
        secondary.push({
          key: 'decline-time',
          label: 'Decline new time',
          variant: 'secondary',
          onPress: declineWorkerProposal,
        });
      } else {
        primary.push({
          key: 'mark-hired',
          label: 'Mark hired',
          onPress: () => void updateStatus('selected'),
        });
        secondary.push(
          {
            key: 'calendar',
            label: 'Add to calendar',
            variant: 'secondary',
            onPress: handleAddInterviewToCalendar,
          },
          {
            key: 'view-calendar',
            label: 'View on calendar',
            variant: 'secondary',
            onPress: () =>
              router.push(
                getClinicCalendarRoute(application.interview_at?.slice(0, 10) ?? undefined),
              ),
          },
          ...(clinicProposedChange || workerProposedChange
            ? []
            : [
                {
                  key: 'reschedule',
                  label: 'Reschedule',
                  variant: 'secondary' as const,
                  onPress: () => onScheduleInterview?.(application, 'propose_reschedule'),
                },
              ]),
        );
        secondary.push({
          key: 'cancel-interview',
          label: 'Cancel interview',
          variant: 'secondary',
          onPress: cancelScheduledInterview,
        });
      }
      if (!workerProposedChange) {
        destructive.push(rejectAction());
      }
      return { primary, secondary, destructive };
    }

    return { primary, secondary, destructive };
  };

  const workflowActions = buildWorkflowActions();

  const hasQualifications =
    !workerDeleted &&
    hasKitSubmitted &&
    (application.years_of_experience != null ||
      formatApplicationEducation(application.education) ||
      resolveWorkerRoleTypes(application).length > 0 ||
      (application.software_used ?? []).length > 0 ||
      (application.practice_types ?? []).length > 0);

  const hasDocuments = !workerDeleted && hasKitSubmitted;

  const hasSummaryContent =
    !workerDeleted &&
    (application.cover_message?.trim() ||
      appliedLabel ||
      (isScreeningStage && !hasKitSubmitted) ||
      hasKitSubmitted);

  const screeningBadgeLabel =
    screeningDismissHydrated &&
    isScreeningStage &&
    !awaitingKit &&
    application.screening &&
    !dismissedScreeningReviewIds.has(application.id)
      ? hasNewApplication
        ? 'New'
        : 'Needs review'
      : null;

  return (
    <>
      <View style={styles.stack}>
        <ApplicantHeroCard
          application={application}
          applicantName={applicantName}
          workerDeleted={workerDeleted}
          experienceLabel={experienceLabel}
          appliedLabel={appliedLabel}
          showNewBadge={showNewBadge}
          showStatusBadge={showStatusBadge}
          jobMatch={jobMatch}
          matchContext={matchContext}
          accent={accent}
        />

        <ApplicationStatusSummaryCard
          audience="clinic"
          status={application.status}
          postType={application.post_type}
          applicationKitRequestedAt={application.application_kit_requested_at}
          applicationKitSubmittedAt={application.application_kit_submitted_at}
          interviewProposedAt={application.interview_proposed_at}
          workerAccountDeleted={workerDeleted}
          isHighlighted={hasNewApplication}
        />

        {!workerDeleted ? (
          <ActionPanel
            primary={workflowActions.primary}
            secondary={workflowActions.secondary}
            destructive={workflowActions.destructive}
            accent={accent}
            messageAction={{
              key: 'message',
              label: hasUnreadMessages ? 'Message applicant · New' : 'Message applicant',
              onPress: handleMessage,
            }}
            summaryAction={
              canGenerateApplicationPdfPacket(application)
                ? {
                    key: 'candidate-summary',
                    label: isGeneratingPdf ? 'Preparing summary…' : 'Candidate summary',
                    onPress: () => void handleOpenCandidatePacket(),
                    disabled: isGeneratingPdf,
                  }
                : null
            }
            removeAction={
              canRemoveFromList
                ? {
                    key: 'remove',
                    label: 'Remove from list',
                    onPress: () =>
                      confirmHideClinicApplication(clinicId, application, () => onRemoved?.()),
                  }
                : null
            }
          />
        ) : (
          <SurfaceCard padding="md" gap>
            <OnboardingButton label="View messages" accent={accent} solid onPress={handleMessage} />
          </SurfaceCard>
        )}

        {hasInterviewDetails || workerDeleted ? (
          <SurfaceCard padding="md" gap>
            {hasInterviewDetails ? (
              <CardInfoPanel
                variant={application.status === 'interview_offered' ? 'warning' : 'info'}
                icon="calendar-outline"
                title={
                  application.status === 'interview_offered'
                    ? 'Interview invitation'
                    : 'Interview scheduled'
                }>
                <CardInfoPanelText>{interviewSummary}</CardInfoPanelText>
                {application.status === 'interview_offered' ? (
                  <CardInfoPanelText>Awaiting candidate response</CardInfoPanelText>
                ) : null}
                {application.status === 'interview_scheduled' && clinicProposedChange ? (
                  <CardInfoPanelText>
                    Awaiting candidate response to new time
                    {proposedSummary ? ` · ${proposedSummary}` : ''}
                  </CardInfoPanelText>
                ) : null}
                {application.status === 'interview_scheduled' &&
                workerProposedChange &&
                proposedSummary ? (
                  <CardInfoPanelText>Proposed new time · {proposedSummary}</CardInfoPanelText>
                ) : null}
              </CardInfoPanel>
            ) : null}

            {workerDeleted ? (
              <CardInfoPanel variant="default">
                <CardInfoPanelText>
                  This candidate is no longer signed up for Chairside.
                </CardInfoPanelText>
              </CardInfoPanel>
            ) : null}
          </SurfaceCard>
        ) : null}

        {hasSummaryContent ? (
          <ApplicationSummaryCard
            coverMessage={application.cover_message}
            kitSubmitted={hasKitSubmitted}
            isScreeningStage={isScreeningStage}
            appliedLabel={appliedLabel}
            accent={accent}
          />
        ) : null}

        {application.post_type === 'job' && application.screening && !workerDeleted ? (
          <SurfaceCard padding="md" gap>
            <ApplicantDetailSection
              icon="clipboard-outline"
              title="Screening responses"
              accent={accent}
              headerAccessory={
                screeningBadgeLabel ? (
                  <ApplicationCardBadge label={screeningBadgeLabel} accent={accent} />
                ) : null
              }>
              <ApplicationScreeningSection
                screening={application.screening}
                onExpandedChange={(expanded) => {
                  if (expanded) void dismissScreeningReviewBadge(application.id);
                }}
              />
            </ApplicantDetailSection>
          </SurfaceCard>
        ) : null}

        {hasQualifications ? (
          <SurfaceCard padding="md" gap>
            <ApplicantDetailSection icon="ribbon-outline" title="Qualifications" accent={accent}>
              <ApplicantQualificationsGrid application={application} />
            </ApplicantDetailSection>
          </SurfaceCard>
        ) : null}

        {application.interview_details && !workerDeleted ? (
          <SurfaceCard padding="md" gap>
            <ApplicantDetailSection icon="calendar-outline" title="Interview notes" accent={accent}>
              <ApplicationPreviewField
                label="Details"
                value={application.interview_details}
                preserveLabelCase
              />
            </ApplicantDetailSection>
          </SurfaceCard>
        ) : null}

        {hasDocuments ? (
          <SurfaceCard padding="md" gap>
            <ApplicantDetailSection icon="folder-outline" title="Documents" accent={accent}>
              <ApplicationPreviewField
                label="Resume:"
                value={formatApplicationResumeStatus(application.resume_storage_path)}
                preserveLabelCase
                layout="inline"
              />
              {application.resume_storage_path ? (
                <ResumeViewButton
                  storagePath={application.resume_storage_path}
                  fileName={resumeFileName}
                />
              ) : null}
            </ApplicantDetailSection>
          </SurfaceCard>
        ) : null}

        {canManageCrm ? (
          <SurfaceCard padding="md" gap>
            <ClinicWorkerCrmSection
              record={crmRecord}
              onEdit={() => setCrmSheetVisible(true)}
            />
          </SurfaceCard>
        ) : null}
      </View>

      {canManageCrm ? (
        <ClinicWorkerCrmSheet
          visible={crmSheetVisible}
          clinicId={clinicId}
          workerId={application.worker_id}
          workerName={applicantName}
          record={crmRecord}
          onSaved={() => onUpdated?.()}
          onClose={() => setCrmSheetVisible(false)}
        />
      ) : null}

      <ApplicationPdfPacketPreviewModal
        visible={pdfPreviewVisible}
        candidateName={applicantName}
        packet={pdfPreview}
        isLoading={isGeneratingPdf}
        error={pdfPreviewError}
        onClose={() => {
          setPdfPreviewVisible(false);
          setPdfPreviewError(null);
        }}
        onRetry={() => void handleOpenCandidatePacket()}
        onPdfError={(message) => setPdfPreviewError(message)}
      />
    </>
  );
}
