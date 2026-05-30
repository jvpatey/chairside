import {
  acceptApplicationInterview,
  declineApplicationInterview,
  deleteApplication,
  type WorkerApplication,
} from '@chairside/api';
import {
  formatApplicationDate,
  formatInterviewDateTime,
  isActiveApplicationStatus,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { Alert, Text, View } from 'react-native';

import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import {
  DetailProse,
  RowDivider,
} from '@/components/clinic/DetailCard';
import { WorkerApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ApplicationSubmittedFields } from '@/components/worker/ApplicationSubmittedFields';
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
  type WorkerApplicationReturnTarget,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

type WorkerApplicationDetailCardProps = {
  application: WorkerApplication;
  returnTo?: WorkerApplicationReturnTarget;
  onViewPosting?: () => void;
  onCancelled?: () => void;
  onUpdated?: () => void;
  hasUnreadMessages?: boolean;
};

function formatAppliedLabel(application: WorkerApplication): string | null {
  const date = formatApplicationDate(application.created_at);
  if (!date) return null;
  return `${application.post_type === 'shift' ? 'Requested' : 'Applied'} ${date}`;
}

export function WorkerApplicationDetailCard({
  application,
  returnTo = 'applications-tab',
  onViewPosting,
  onCancelled,
  onUpdated,
  hasUnreadMessages = false,
}: WorkerApplicationDetailCardProps) {
  const { colors } = useTheme();
  const canCancel = isActiveApplicationStatus(application.status);
  const isShift = application.post_type === 'shift';
  const jobMatch = !isShift ? parseApplicationJobMatch(application) : null;
  const matchContext = !isShift ? getApplicationMatchDisplayContext(application) : null;
  const clinicLocation = application.clinic_city ?? null;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    hero: {
      padding: spacing.lg,
    },
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
    body: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.lg,
    },
    submittedSection: {
      gap: spacing.md,
    },
    sectionEyebrow: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
    },
    subsection: {
      gap: spacing.sm,
    },
    actionsSection: {
      gap: spacing.sm,
    },
    actionsLabel: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.labelPrimary,
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
    interviewCard: {
      backgroundColor: colors.secondarySubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    interviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    interviewTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.labelPrimary,
      flex: 1,
    },
    interviewMeta: typography.subtitle,
  }));

  const handleMessage = () => {
    router.push(getWorkerApplicationMessagesRoute(application.id, returnTo));
  };

  const interviewSummary = formatInterviewDateTime(
    application.interview_at,
    application.interview_duration_minutes,
  );

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
    Alert.alert(
      'Accept interview?',
      'Confirm that you can attend at the proposed date and time.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Accept interview',
          onPress: () => {
            void (async () => {
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
            })();
          },
        },
      ],
    );
  };

  const handleDeclineInterview = () => {
    Alert.alert(
      'Decline interview?',
      'The clinic will be notified. You will remain shortlisted for this role.',
      [
        { text: 'Keep invitation', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: () => {
            void (async () => {
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
            })();
          },
        },
      ],
    );
  };

  const handleCancel = () => {
    Alert.alert(
      isShift ? 'Withdraw cover request?' : 'Cancel application?',
      isShift
        ? 'This removes your request from the clinic. You can request to cover again if the shift is still open.'
        : 'This removes your application from the clinic. You can apply again later if the posting is still open.',
      [
        { text: isShift ? 'Keep request' : 'Keep application', style: 'cancel' },
        {
          text: isShift ? 'Withdraw request' : 'Cancel application',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await deleteApplication(application.worker_id, application.id);
                onCancelled?.();
              } catch (error) {
                Alert.alert(
                  isShift ? 'Could not withdraw request' : 'Could not cancel application',
                  error instanceof Error ? error.message : 'Please try again.',
                );
              }
            })();
          },
        },
      ],
    );
  };

  const primarySlots: {
    key: string;
    label: string;
    onPress: () => void;
    disabled?: boolean;
  }[] = [
    {
      key: 'message',
      label: hasUnreadMessages ? 'Message clinic · New' : 'Message clinic',
      onPress: handleMessage,
    },
    {
      key: 'posting',
      label: application.post_type === 'job' ? 'View role' : 'View shift',
      onPress: () => onViewPosting?.(),
      disabled: !onViewPosting,
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
      label: isShift ? 'Withdraw request' : 'Cancel application',
      variant: 'destructive',
      onPress: handleCancel,
    });
  }

  const actionRows = [0, 1].map((index) => ({
    primary: primarySlots[index] ?? null,
    secondary: secondarySlots[index] ?? null,
  }));

  const hasActions = actionRows.some((row) => row.primary || row.secondary);

  return (
    <View style={styles.card}>
      <View style={styles.hero}>
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
      </View>

      <RowDivider />

      <View style={styles.body}>
        {application.status === 'interview_offered' && interviewSummary ? (
          <View style={styles.interviewCard}>
            <View style={styles.interviewHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.warning} />
              <Text style={styles.interviewTitle}>Interview invitation</Text>
            </View>
            <Text style={styles.interviewMeta}>{interviewSummary}</Text>
            {application.interview_details ? (
              <Text style={styles.interviewMeta}>{application.interview_details}</Text>
            ) : null}
            <OnboardingButton label="Accept interview" onPress={handleAcceptInterview} />
            <OnboardingButton
              label="Decline"
              variant="destructive"
              onPress={handleDeclineInterview}
            />
          </View>
        ) : null}

        {application.status === 'interview_scheduled' && interviewSummary ? (
          <View style={styles.interviewCard}>
            <View style={styles.interviewHeader}>
              <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
              <Text style={styles.interviewTitle}>Interview confirmed</Text>
            </View>
            <Text style={styles.interviewMeta}>{interviewSummary}</Text>
            {application.interview_details ? (
              <Text style={styles.interviewMeta}>{application.interview_details}</Text>
            ) : null}
            <OnboardingButton label="Add to calendar" onPress={handleAddInterviewToCalendar} />
          </View>
        ) : null}

        <View style={styles.submittedSection}>
          <Text style={styles.sectionEyebrow}>What you submitted</Text>
          <ApplicationSubmittedFields application={application} />

          {application.cover_message ? (
            <>
              <RowDivider />
              <View style={styles.subsection}>
                <Text style={styles.sectionEyebrow}>Cover message</Text>
                <DetailProse text={application.cover_message} />
              </View>
            </>
          ) : null}
        </View>

        {hasActions ? (
          <>
            <RowDivider />
            <View style={styles.actionsSection}>
            <Text style={styles.actionsLabel}>Actions</Text>
            <View style={styles.actionsGrid}>
              {actionRows.map((row, rowIndex) => {
                const slots = [
                  row.primary
                    ? {
                        key: row.primary.key,
                        label: row.primary.label,
                        onPress: row.primary.onPress,
                        disabled: row.primary.disabled,
                        variant: 'primary' as const,
                      }
                    : null,
                  row.secondary
                    ? {
                        key: row.secondary.key,
                        label: row.secondary.label,
                        onPress: row.secondary.onPress,
                        variant: row.secondary.variant,
                      }
                    : null,
                ].filter((slot): slot is NonNullable<typeof slot> => slot != null);

                if (slots.length === 0) return null;

                return (
                  <View key={`action-row-${rowIndex}`} style={styles.actionsRow}>
                    {slots.map((slot) => (
                      <View key={slot.key} style={styles.actionCell}>
                        <OnboardingButton
                          label={slot.label}
                          variant={slot.variant}
                          onPress={slot.onPress}
                          disabled={'disabled' in slot ? slot.disabled : undefined}
                        />
                      </View>
                    ))}
                  </View>
                );
              })}
            </View>
          </View>
          </>
        ) : null}
      </View>
    </View>
  );
}
