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
  formatApplicationEducation,
  formatApplicationResumeStatus,
  formatInterviewDateTime,
  formatRoleTypesLabel,
  getSpecialtyLabel,
  hasApplicationKitSubmitted,
  hasPendingInterviewProposal,
  isActiveApplicationStatus,
  isAwaitingApplicationKit,
  isScreeningStageStatus,
  resolveWorkerRoleTypes,
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
import { Alert, Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { ApplicationScreeningSection } from '@/components/clinic/ApplicationScreeningSection';
import { InterviewScheduleSheet } from '@/components/clinic/InterviewScheduleSheet';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { cardShellRadii } from '@/components/ui/cardLayout';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ApplicationClinicMapsLink } from '@/components/worker/ApplicationClinicMapsLink';
import { ApplicationPreviewField } from '@/components/worker/ApplicationPackageFields';
import { WorkerApplicationKitSubmission } from '@/components/worker/WorkerApplicationKitSubmission';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
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
  getWorkerApplicationMessagesRoute,
  getWorkerClinicProfileRoute,
  getWorkerJobDetailRoute,
  getWorkerShiftDetailRoute,
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { confirmHideWorkerApplication } from '@/lib/workerApplicationHide';
import {
  getWorkerApplicationClinicLocationLabel,
  getWorkerApplicationMapsDestination,
  hasMappableWorkerApplicationClinicLocation,
} from '@/lib/workerApplicationMaps';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type WorkerApplicationDetailCardProps = {
  application: WorkerApplication;
  returnTo?: WorkerApplicationReturnTarget;
  onViewPosting?: () => void;
  onCancelled?: () => void;
  onUpdated?: () => void;
  onHidden?: () => void;
  hasUnreadMessages?: boolean;
};

type ActionButtonSpec = {
  key: string;
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  onPress: () => void;
  disabled?: boolean;
};

type SectionIcon = React.ComponentProps<typeof Ionicons>['name'];

function WorkerApplicationDetailSection({
  icon,
  title,
  children,
}: {
  icon: SectionIcon;
  title: string;
  children: ReactNode;
}) {
  const { colors } = useTheme();
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
      backgroundColor: colors.primarySubtle,
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
        <View style={styles.iconWrap}>
          <Ionicons name={icon} size={15} color={colors.primary} />
        </View>
        <Text style={styles.title}>{title}</Text>
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

function renderActionButtons(actions: ActionButtonSpec[]) {
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
                onPress={action.onPress}
                disabled={action.disabled}
              />
            ))}
          </ApplicationActionRow>
        ),
      )}
    </>
  );
}

function WorkerApplicationHeroCard({
  application,
  appliedLabel,
  clinicLocation,
  jobMatch,
  matchContext,
  onClinicPress,
}: {
  application: WorkerApplication;
  appliedLabel: string | null;
  clinicLocation: string | null;
  jobMatch: ReturnType<typeof parseApplicationJobMatch>;
  matchContext: ReturnType<typeof getApplicationMatchDisplayContext>;
  onClinicPress?: () => void;
}) {
  const logoUri = useClinicLogoUri(application.clinic_logo_storage_path);
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
    clinicName: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    clinicNameLink: {
      ...typography.body,
      fontSize: 14,
      lineHeight: 20,
      color: colors.primary,
    },
    clinicNamePressable: {
      alignSelf: 'flex-start',
      borderRadius: 8,
    },
    title: {
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

  const metaParts = [clinicLocation, appliedLabel].filter(Boolean);

  return (
    <SurfaceCard padding="md" gap>
      <View style={styles.wrap}>
        <View style={styles.topRow}>
          <ClinicLogoAvatar
            clinicName={application.clinic_name}
            logoUri={logoUri}
            size={56}
          />
          <View style={styles.identity}>
            {onClinicPress ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`View ${application.clinic_name} profile`}
                onPress={onClinicPress}
                style={({ pressed }) => [
                  styles.clinicNamePressable,
                  pressed && { opacity: 0.75 },
                ]}>
                <Text style={styles.clinicNameLink} numberOfLines={2}>
                  {application.clinic_name}
                </Text>
              </Pressable>
            ) : (
              <Text style={styles.clinicName} numberOfLines={2}>
                {application.clinic_name}
              </Text>
            )}
            <Text style={styles.title} numberOfLines={2}>
              {application.post_title}
            </Text>
            {metaParts.length > 0 ? (
              <Text style={styles.metaLine} numberOfLines={3}>
                {metaParts.join(' · ')}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={styles.badgeRow}>
          <WorkerApplicationStatusBadge
            status={application.status}
            postType={application.post_type}
          />
          {jobMatch && matchContext ? (
            <MatchTierBadge
              breakdown={jobMatch}
              context={matchContext}
              subtitle={application.post_title}
            />
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

function WorkerQualificationsGrid({ application }: { application: WorkerApplication }) {
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

function WorkerApplicationSummaryCard({
  coverMessage,
  kitSubmitted,
  isScreeningStage,
  appliedLabel,
}: {
  coverMessage?: string | null;
  kitSubmitted: boolean;
  isScreeningStage: boolean;
  appliedLabel: string | null;
}) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    quote: {
      backgroundColor: colors.fillSubtle,
      borderRadius: cardShellRadii.inner,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
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

  return (
    <SurfaceCard padding="md" gap>
      <WorkerApplicationDetailSection icon="document-text-outline" title="Application summary">
        <View style={styles.metaList}>
          {appliedLabel ? (
            <ApplicationPreviewField label="Submitted" value={appliedLabel} preserveLabelCase />
          ) : null}
          {isScreeningStage && !kitSubmitted ? (
            <ApplicationPreviewField
              label="Application kit"
              value="Not submitted yet"
              preserveLabelCase
            />
          ) : null}
          {kitSubmitted ? (
            <ApplicationPreviewField
              label="Application kit"
              value="Submitted"
              preserveLabelCase
            />
          ) : null}
        </View>
        {coverMessage?.trim() ? (
          <View style={styles.quote}>
            <Text style={styles.quoteLabel}>Cover message</Text>
            <Text style={styles.quoteText}>{coverMessage.trim()}</Text>
          </View>
        ) : null}
      </WorkerApplicationDetailSection>
    </SurfaceCard>
  );
}

function WorkerActionPanel({
  primary,
  secondary,
  destructive,
  messageAction,
  postingAction,
  clinicProfileAction,
  removeAction,
}: {
  primary: ActionButtonSpec[];
  secondary: ActionButtonSpec[];
  destructive: ActionButtonSpec[];
  messageAction: ActionButtonSpec;
  postingAction: ActionButtonSpec | null;
  clinicProfileAction: ActionButtonSpec | null;
  removeAction: ActionButtonSpec | null;
}) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    wrap: {
      gap: 0,
    },
    primaryBlock: {
      gap: spacing.sm,
    },
    utilityBlock: {
      gap: spacing.sm,
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
  }));

  const hasWorkflow = primary.length > 0 || secondary.length > 0 || destructive.length > 0;

  return (
    <SurfaceCard padding="md" gap>
      <View style={styles.wrap}>
        {hasWorkflow ? (
          <View style={styles.primaryBlock}>
            {renderActionButtons(primary)}
            {renderActionButtons(
              secondary.map((action) => ({ ...action, variant: action.variant ?? 'secondary' })),
            )}
            {renderActionButtons(
              destructive.map((action) => ({ ...action, variant: action.variant ?? 'destructive' })),
            )}
          </View>
        ) : null}

        <View
          style={[
            styles.utilityBlock,
            !hasWorkflow && { borderTopWidth: 0, marginTop: 0, paddingTop: 0 },
          ]}>
          <OnboardingButton
            label={messageAction.label}
            onPress={messageAction.onPress}
          />
          {postingAction ? (
            <OnboardingButton
              label={postingAction.label}
              variant="secondary"
              onPress={postingAction.onPress}
              disabled={postingAction.disabled}
            />
          ) : null}
          {clinicProfileAction ? (
            <OnboardingButton
              label={clinicProfileAction.label}
              variant="secondary"
              onPress={clinicProfileAction.onPress}
              disabled={clinicProfileAction.disabled}
            />
          ) : null}
          {removeAction ? (
            <OnboardingButton
              label={removeAction.label}
              variant="ghost"
              onPress={removeAction.onPress}
            />
          ) : null}
        </View>
      </View>
    </SurfaceCard>
  );
}

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
}: WorkerApplicationDetailCardProps) {
  const [rescheduleVisible, setRescheduleVisible] = useState(false);
  const clinicDeleted = application.clinic_account_deleted;
  const canCancel = isActiveApplicationStatus(application.status) && !clinicDeleted;
  const canHide = canWorkerHideApplication(application);
  const isShift = application.post_type === 'shift';
  const jobMatch = !isShift ? parseApplicationJobMatch(application) : null;
  const matchContext = !isShift ? getApplicationMatchDisplayContext(application) : null;
  const clinicLocation = application.clinic_city ?? null;
  const clinicMapsLabel = getWorkerApplicationClinicLocationLabel(application);
  const clinicMapsDestination = getWorkerApplicationMapsDestination(application);
  const showInterviewClinicMapsLink =
    application.status === 'interview_scheduled' &&
    hasMappableWorkerApplicationClinicLocation(application);
  const appliedLabel = formatAppliedLabel(application);

  const styles = useThemedStyles(({ spacing }) => ({
    stack: {
      gap: spacing.lg,
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

  const canViewClinicProfile =
    !clinicDeleted && Boolean(application.clinic_id);

  const handleViewClinicProfile = () => {
    if (!application.clinic_id) return;
    router.push(getWorkerClinicProfileRoute(application.clinic_id));
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
      clinicLocation: clinicMapsLabel,
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
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert(
            isShift ? 'Request withdrawn' : 'Application cancelled',
            isShift
              ? 'Your cover request has been removed.'
              : 'Your application has been cancelled.',
            [{ text: 'OK', onPress: () => onCancelled?.() }],
          );
        } catch (error) {
          Alert.alert(
            isShift ? 'Could not withdraw request' : 'Could not cancel application',
            error instanceof Error ? error.message : 'Please try again.',
          );
        }
      },
    });
  };

  const buildWorkflowActions = (): {
    primary: ActionButtonSpec[];
    secondary: ActionButtonSpec[];
    destructive: ActionButtonSpec[];
  } => {
    const primary: ActionButtonSpec[] = [];
    const secondary: ActionButtonSpec[] = [];
    const destructive: ActionButtonSpec[] = [];

    const appendCancelIfNeeded = () => {
      if (
        canCancel &&
        !destructive.some((action) => action.key === 'cancel') &&
        !destructive.some((action) => action.key === 'cancel-interview')
      ) {
        destructive.push({
          key: 'cancel',
          label: isShift ? 'Withdraw request' : 'Cancel application',
          onPress: handleCancel,
        });
      }
    };

    if (clinicDeleted) {
      return { primary, secondary, destructive };
    }

    if (application.status === 'interview_offered' && interviewSummary) {
      primary.push({
        key: 'accept-interview',
        label: 'Accept interview',
        onPress: handleAcceptInterview,
      });
      destructive.push({
        key: 'decline-interview',
        label: 'Decline interview',
        onPress: handleDeclineInterview,
      });
      appendCancelIfNeeded();
      return { primary, secondary, destructive };
    }

    if (application.status === 'interview_scheduled' && interviewSummary) {
      if (clinicProposedChange) {
        primary.push({
          key: 'accept-time',
          label: 'Accept new time',
          onPress: handleAcceptProposal,
        });
        destructive.push({
          key: 'decline-time',
          label: 'Decline new time',
          onPress: handleDeclineProposal,
        });
      } else if (!workerProposedChange) {
        primary.push({
          key: 'calendar',
          label: 'Add to calendar',
          onPress: handleAddInterviewToCalendar,
        });
        secondary.push({
          key: 'reschedule',
          label: 'Request new time',
          onPress: () => setRescheduleVisible(true),
        });
        destructive.push({
          key: 'cancel-interview',
          label: 'Cancel interview',
          onPress: handleCancelScheduledInterview,
        });
      }
      appendCancelIfNeeded();
      return { primary, secondary, destructive };
    }

    appendCancelIfNeeded();
    return { primary, secondary, destructive };
  };

  const workflowActions = buildWorkflowActions();

  const messageAction: ActionButtonSpec = {
    key: 'message',
    label: clinicDeleted
      ? 'View messages'
      : hasUnreadMessages
        ? 'Message clinic · New'
        : 'Message clinic',
    onPress: handleMessage,
  };

  const postingAction: ActionButtonSpec | null = canViewPosting
    ? {
        key: 'posting',
        label: application.post_type === 'job' ? 'View role' : 'View shift',
        onPress: handleViewPosting,
      }
    : null;

  const clinicProfileAction: ActionButtonSpec | null = canViewClinicProfile
    ? {
        key: 'clinic-profile',
        label: 'View clinic profile',
        onPress: handleViewClinicProfile,
      }
    : null;

  const removeAction: ActionButtonSpec | null = canHide
    ? {
        key: 'hide',
        label: 'Remove from list',
        onPress: () => confirmHideWorkerApplication(application, () => onHidden?.()),
      }
    : null;

  const hasInterviewDetails =
    !clinicDeleted &&
    (application.status === 'interview_offered' ||
      application.status === 'interview_scheduled') &&
    interviewSummary;

  const hasStatusCard = hasInterviewDetails || awaitingKit || clinicDeleted;

  const hasQualifications =
    hasKitSubmitted &&
    (application.years_of_experience != null ||
      formatApplicationEducation(application.education) ||
      resolveWorkerRoleTypes(application).length > 0 ||
      (application.software_used ?? []).length > 0 ||
      (application.practice_types ?? []).length > 0);

  const hasSummaryContent =
    application.cover_message?.trim() ||
    appliedLabel ||
    (isScreeningStage && !hasKitSubmitted) ||
    hasKitSubmitted;

  const resumeFileName = buildResumeFileName({
    workerDisplayName: application.worker_display_name,
    postTitle: application.post_title,
  });

  const showScreeningCard =
    !hasKitSubmitted &&
    application.post_type === 'job' &&
    application.screening != null;

  return (
    <>
      <View style={styles.stack}>
        <WorkerApplicationHeroCard
          application={application}
          appliedLabel={appliedLabel}
          clinicLocation={clinicLocation}
          jobMatch={jobMatch}
          matchContext={matchContext}
          onClinicPress={canViewClinicProfile ? handleViewClinicProfile : undefined}
        />

        {clinicDeleted ? (
          <SurfaceCard padding="md" gap>
            <OnboardingButton label="View messages" onPress={handleMessage} />
            {canHide ? (
              <OnboardingButton
                label="Remove from list"
                variant="ghost"
                onPress={() => confirmHideWorkerApplication(application, () => onHidden?.())}
              />
            ) : null}
          </SurfaceCard>
        ) : (
          <WorkerActionPanel
            primary={workflowActions.primary}
            secondary={workflowActions.secondary}
            destructive={workflowActions.destructive}
            messageAction={messageAction}
            postingAction={postingAction}
            clinicProfileAction={clinicProfileAction}
            removeAction={removeAction}
          />
        )}

        {hasStatusCard ? (
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
                {application.interview_details ? (
                  <CardInfoPanelText>{application.interview_details}</CardInfoPanelText>
                ) : null}
                {showInterviewClinicMapsLink && clinicMapsDestination && clinicMapsLabel ? (
                  <ApplicationClinicMapsLink
                    destination={clinicMapsDestination}
                    label={clinicMapsLabel}
                  />
                ) : null}
                {application.status === 'interview_scheduled' && clinicProposedChange ? (
                  <CardInfoPanelText>
                    Clinic proposed new time
                    {proposedSummary ? ` · ${proposedSummary}` : ''}
                  </CardInfoPanelText>
                ) : null}
                {application.status === 'interview_scheduled' &&
                workerProposedChange &&
                proposedSummary ? (
                  <CardInfoPanelText>
                    Awaiting clinic response · {proposedSummary}
                  </CardInfoPanelText>
                ) : null}
              </CardInfoPanel>
            ) : null}

            {awaitingKit ? (
              <CardInfoPanel variant="default" icon="document-text-outline" title="Application kit">
                <CardInfoPanelText>
                  The clinic requested your full application. Submit your application kit below.
                </CardInfoPanelText>
              </CardInfoPanel>
            ) : null}

            {clinicDeleted ? (
              <CardInfoPanel variant="default">
                <CardInfoPanelText>
                  This clinic is no longer signed up for Chairside.
                </CardInfoPanelText>
              </CardInfoPanel>
            ) : null}
          </SurfaceCard>
        ) : null}

        {awaitingKit ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationKitSubmission
              applicationId={application.id}
              clinicName={application.clinic_name}
              postTitle={application.post_title}
              onSubmitted={onUpdated}
            />
          </SurfaceCard>
        ) : null}

        {hasSummaryContent ? (
          <WorkerApplicationSummaryCard
            coverMessage={application.cover_message}
            kitSubmitted={hasKitSubmitted}
            isScreeningStage={isScreeningStage}
            appliedLabel={appliedLabel}
          />
        ) : null}

        {showScreeningCard ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationDetailSection icon="clipboard-outline" title="Screening responses">
              <ApplicationScreeningSection screening={application.screening!} audience="worker" />
            </WorkerApplicationDetailSection>
          </SurfaceCard>
        ) : null}

        {isScreeningStage && !hasKitSubmitted && !application.screening ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationDetailSection icon="clipboard-outline" title="Screening responses">
              <ApplicationPreviewField
                label="Status"
                value="Screening responses submitted"
                preserveLabelCase
              />
            </WorkerApplicationDetailSection>
          </SurfaceCard>
        ) : null}

        {hasQualifications ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationDetailSection icon="ribbon-outline" title="Qualifications">
              <WorkerQualificationsGrid application={application} />
            </WorkerApplicationDetailSection>
          </SurfaceCard>
        ) : null}

        {application.interview_details &&
        application.status !== 'interview_offered' &&
        application.status !== 'interview_scheduled' ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationDetailSection icon="calendar-outline" title="Interview notes">
              <ApplicationPreviewField
                label="Details"
                value={application.interview_details}
                preserveLabelCase
              />
            </WorkerApplicationDetailSection>
          </SurfaceCard>
        ) : null}

        {hasKitSubmitted ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationDetailSection icon="folder-outline" title="Documents">
              <ApplicationPreviewField
                label="Resume"
                value={formatApplicationResumeStatus(application.resume_storage_path)}
                preserveLabelCase
              />
              {application.resume_storage_path ? (
                <ResumeViewButton
                  storagePath={application.resume_storage_path}
                  fileName={resumeFileName}
                />
              ) : null}
            </WorkerApplicationDetailSection>
          </SurfaceCard>
        ) : null}

        {hasKitSubmitted &&
        application.post_type === 'job' &&
        application.screening ? (
          <SurfaceCard padding="md" gap>
            <WorkerApplicationDetailSection icon="clipboard-outline" title="Screening responses">
              <ApplicationScreeningSection screening={application.screening} audience="worker" />
            </WorkerApplicationDetailSection>
          </SurfaceCard>
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
}
