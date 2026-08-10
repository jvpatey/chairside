import {
  acceptApplicationInterviewUpdate,
  cancelApplicationInterviewOffer,
  cancelConfirmedFillIn,
  cancelScheduledApplicationInterview,
  confirmFillInApplicant,
  declineApplicationInterviewUpdate,
  deleteConfirmedFillIn,
  FILL_IN_PENDING_STATUSES,
  getApplicantDisplayName,
  requestApplicationKit,
  updateApplicationStatus,
  markJobApplicantHired,
  type ClinicApplication,
} from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  formatApplicationDate,
  formatInterviewDateTime,
  formatISODateLabel,
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
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { Alert, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ApplicantReviewHero } from '@/components/matching/ApplicantReviewHero';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import {
  ClinicWorkerCrmSection,
  ClinicWorkerCrmSheet,
} from '@/components/clinic/ClinicWorkerCrmSheet';
import { ApplicationPdfPacketPreviewModal } from '@/components/clinic/ApplicationPdfPacketPreviewModal';
import { ApplicationScreeningSection } from '@/components/clinic/ApplicationScreeningSection';
import { CancelFillInSheet } from '@/components/clinic/CancelFillInSheet';
import { ApplicationPreviewField } from '@/components/worker/ApplicationPackageFields';
import type { InterviewScheduleSheetMode } from '@/components/clinic/InterviewScheduleSheet';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { cardShellRadii } from '@/components/ui/cardLayout';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
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
import { getFirstName } from '@/lib/greeting';
import { resolveAccentColor, resolveAccentSubtle } from '@/lib/accentColors';
import type { HiringCelebrationPayload } from '@/lib/hiringCelebrationCopy';
import { fontSemibold, useTheme, useThemedStyles, type GradientAccent } from '@/theme';

function useBrandColors(accent: GradientAccent) {
  const { colors } = useTheme();
  return {
    brand: resolveAccentColor(colors, accent),
    brandSubtle: resolveAccentSubtle(colors, accent),
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
  const {
    billing,
    upgradePrompt,
    showCrmUpgrade,
    showPdfExportUpgrade,
    handleBillingError,
  } = useClinicUpgradePrompt();
  const [crmSheetVisible, setCrmSheetVisible] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfPreviewVisible, setPdfPreviewVisible] = useState(false);
  const [pdfPreview, setPdfPreview] = useState<ApplicationPdfPacketResult | null>(null);
  const [pdfPreviewError, setPdfPreviewError] = useState<string | null>(null);
  const [cancelFillInSheetVisible, setCancelFillInSheetVisible] = useState(false);
  const [deleteFillInSheetVisible, setDeleteFillInSheetVisible] = useState(false);
  const { isHydrated: screeningDismissHydrated, dismissedIds: dismissedScreeningReviewIds, dismiss: dismissScreeningReviewBadge } =
    useDismissedScreeningReviews();
  const isJob = application.post_type === 'job';
  const accent: GradientAccent = isJob ? 'tertiary' : 'secondary';
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

  // Repair older hires where the application was selected but the role stayed live.
  const repairedHireRef = useRef<string | null>(null);
  useEffect(() => {
    if (!isJob || application.status !== 'selected' || !application.job_post_id) return;
    if (repairedHireRef.current === application.id) return;
    repairedHireRef.current = application.id;
    void markJobApplicantHired(application.id).catch(() => {
      // Ignore — role may already be filled or RPC not migrated yet.
    });
  }, [application.id, application.job_post_id, application.status, isJob]);

  const styles = useThemedStyles(({ spacing }) => ({
    stack: {
      gap: spacing.lg,
    },
  }));

  const updateStatus = async (status: Parameters<typeof updateApplicationStatus>[1]) => {
    try {
      if (status === 'selected') {
        await markJobApplicantHired(application.id);
      } else {
        await updateApplicationStatus(application.id, status);
      }
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
    const isPendingInvite = application.status === 'interview_offered';
    showConfirmActionSheet({
      title: isPendingInvite ? 'Accept suggested time?' : 'Accept new time?',
      message: isPendingInvite
        ? 'This confirms the interview at the candidate’s suggested time.'
        : 'The confirmed interview will move to the proposed time.',
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
    const isPendingInvite = application.status === 'interview_offered';
    showConfirmActionSheet({
      title: isPendingInvite ? 'Decline suggestion?' : 'Decline new time?',
      message: isPendingInvite
        ? 'Your original interview invitation stays. The candidate can accept it or suggest again.'
        : 'The confirmed interview time will stay as scheduled.',
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
  const applicantFirstName = getFirstName(applicantName) ?? applicantName;
  const workerDeleted = application.worker_account_deleted;

  const isFillInPending =
    application.post_type === 'shift' &&
    FILL_IN_PENDING_STATUSES.includes(application.status) &&
    !workerDeleted;

  const isConfirmedFillIn =
    application.post_type === 'shift' && application.status === 'hired' && !workerDeleted;

  const hasActions =
    !workerDeleted &&
    (isScreeningStage ||
      application.status === 'applied' ||
      application.status === 'reviewed' ||
      application.status === 'in_progress' ||
      application.status === 'interview_offered' ||
      application.status === 'interview_scheduled' ||
      isConfirmedFillIn);

  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} ${
          application.years_of_experience === 1 ? 'year' : 'years'
        } experience`
      : null;
  const appliedDateLabel = formatApplicationDate(application.created_at);
  const appliedLabel = appliedDateLabel ? `Applied ${appliedDateLabel}` : null;

  const photoUri = useWorkerPhotoUri(
    workerDeleted ? null : application.worker_photo_storage_path,
  );
  const metaParts = [
    workerDeleted ? null : application.worker_address?.trim(),
    experienceLabel,
    appliedLabel,
  ].filter(Boolean);

  const canRemoveFromList = canClinicHideApplication(application);
  const canManageCrm = !workerDeleted;
  const crmUnlocked = billing == null || billing.canUseCrmFollowups;
  const pdfExportUnlocked = billing == null || billing.canUseApplicationPdfExport;
  const crmRecord = application.clinic_crm;

  const handleMessage = () => {
    router.push(getClinicApplicationMessagesRoute(application.id, returnTo));
  };

  const handleOpenCrm = () => {
    if (!crmUnlocked) {
      showCrmUpgrade();
      return;
    }
    setCrmSheetVisible(true);
  };

  const handleOpenCandidatePacket = async () => {
    if (!canGenerateApplicationPdfPacket(application) || isGeneratingPdf) return;
    if (!pdfExportUnlocked) {
      showPdfExportUpgrade();
      return;
    }

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
      if (handleBillingError(error)) {
        setIsGeneratingPdf(false);
        return;
      }
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
          const confirmed = await confirmFillInApplicant(clinicId, application.id);
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onConfirmed?.({
            applicationId: application.id,
            postType: 'shift',
            audience: 'clinic',
            counterpartName: applicantName,
            postTitle: getRoleTypeLabel(application.post_role_type),
            shiftDateLabel: application.shift_date
              ? formatISODateLabel(application.shift_date)
              : null,
            applicationUpdatedAt: confirmed.updated_at,
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

  const handleMarkHired = () => {
    showConfirmActionSheet({
      title: 'Mark hired?',
      message: `Confirm ${applicantName} as hired for ${application.post_title}? They will be notified.`,
      confirmLabel: 'Mark hired',
      onConfirm: () => updateStatus('selected'),
    });
  };

  const handleSubmitCancelConfirmedFillIn = async (message: string) => {
    await cancelConfirmedFillIn(application.id, { message });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onUpdated?.();
    onDecided?.();
  };

  const handleSubmitDeleteConfirmedFillIn = async (message: string) => {
    await deleteConfirmedFillIn(application.id, { message });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onRemoved?.();
  };

  const handleDeleteConfirmedFillIn = () => {
    if (!application.shift_post_id) return;
    setDeleteFillInSheetVisible(true);
  };

  const showNewBadge = hasNewApplication;

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

    if (isConfirmedFillIn) {
      destructive.push({
        key: 'cancel-fill-in',
        label: 'Cancel fill-in',
        variant: 'secondary',
        onPress: () => setCancelFillInSheetVisible(true),
      });
      destructive.push({
        key: 'delete-fill-in',
        label: 'Delete fill-in',
        onPress: handleDeleteConfirmedFillIn,
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
      if (workerProposedChange) {
        primary.push({
          key: 'accept-time',
          label: 'Accept suggested time',
          onPress: acceptWorkerProposal,
        });
        secondary.push(
          {
            key: 'send-different-time',
            label: 'Send different time',
            variant: 'secondary',
            onPress: () => onScheduleInterview?.(application, 'edit_offer'),
          },
          {
            key: 'decline-time',
            label: 'Decline suggestion',
            variant: 'secondary',
            onPress: declineWorkerProposal,
          },
        );
      } else {
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
      }
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
          onPress: handleMarkHired,
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
        <ApplicantReviewHero
          avatar={
            <WorkerProfileAvatar displayName={applicantName} photoUri={photoUri} size={56} />
          }
          title={applicantName}
          meta={metaParts.length > 0 ? metaParts.join(' · ') : null}
          trailingBadge={
            jobMatch && matchContext ? (
              <MatchTierBadge
                breakdown={jobMatch}
                context={matchContext}
                subtitle={application.post_title}
                audience="clinic"
              />
            ) : undefined
          }
          badges={showNewBadge ? <ApplicationCardBadge accent={accent} /> : undefined}
          status={{
            audience: 'clinic',
            status: application.status,
            postType: application.post_type,
            applicationKitRequestedAt: application.application_kit_requested_at,
            applicationKitSubmittedAt: application.application_kit_submitted_at,
            interviewProposedAt: application.interview_proposed_at,
            interviewProposedBy: application.interview_proposed_by,
            counterpartFirstName: applicantFirstName,
            statusNote: application.status_note,
            statusClosedBy: application.status_closed_by,
            workerAccountDeleted: workerDeleted,
            isHighlighted: hasNewApplication,
          }}
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

        {hasInterviewDetails ? (
          <SurfaceCard padding="md" gap>
            <CardInfoPanel
              variant={application.status === 'interview_offered' ? 'warning' : 'info'}
              icon="calendar-outline"
              title={
                application.status === 'interview_offered'
                  ? 'Interview invitation'
                  : 'Interview scheduled'
              }>
              <CardInfoPanelText>{interviewSummary}</CardInfoPanelText>
              {application.interview_details ? (
                <CardInfoPanelText>{application.interview_details}</CardInfoPanelText>
              ) : null}
              {application.status === 'interview_offered' &&
              workerProposedChange &&
              proposedSummary ? (
                <CardInfoPanelText>
                  {applicantFirstName} suggested · {proposedSummary}
                </CardInfoPanelText>
              ) : null}
              {application.status === 'interview_offered' &&
              workerProposedChange &&
              application.interview_proposed_details ? (
                <CardInfoPanelText>
                  {applicantFirstName}'s message: {application.interview_proposed_details}
                </CardInfoPanelText>
              ) : null}
              {application.status === 'interview_scheduled' && clinicProposedChange ? (
                <CardInfoPanelText>
                  Awaiting {applicantFirstName}'s response to new time
                  {proposedSummary ? ` · ${proposedSummary}` : ''}
                </CardInfoPanelText>
              ) : null}
              {application.status === 'interview_scheduled' &&
              workerProposedChange &&
              proposedSummary ? (
                <CardInfoPanelText>
                  {applicantFirstName} proposed · {proposedSummary}
                </CardInfoPanelText>
              ) : null}
            </CardInfoPanel>
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

        {application.interview_details &&
        !workerDeleted &&
        application.status !== 'interview_offered' &&
        application.status !== 'interview_scheduled' ? (
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
              record={crmUnlocked ? crmRecord : null}
              onEdit={handleOpenCrm}
            />
          </SurfaceCard>
        ) : null}
      </View>

      {canManageCrm && crmUnlocked ? (
        <ClinicWorkerCrmSheet
          visible={crmSheetVisible}
          clinicId={clinicId}
          workerId={application.worker_id}
          workerName={applicantName}
          record={crmRecord}
          onSaved={() => onUpdated?.()}
          onClose={() => setCrmSheetVisible(false)}
          onBillingError={handleBillingError}
        />
      ) : null}

      {upgradePrompt}

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

      {isConfirmedFillIn ? (
        <>
          <CancelFillInSheet
            visible={cancelFillInSheetVisible}
            workerName={applicantName}
            onClose={() => setCancelFillInSheetVisible(false)}
            onSubmit={handleSubmitCancelConfirmedFillIn}
          />
          <CancelFillInSheet
            visible={deleteFillInSheetVisible}
            workerName={applicantName}
            mode="delete"
            onClose={() => setDeleteFillInSheetVisible(false)}
            onSubmit={handleSubmitDeleteConfirmedFillIn}
          />
        </>
      ) : null}
    </>
  );
}
