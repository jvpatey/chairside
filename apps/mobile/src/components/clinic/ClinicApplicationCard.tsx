import {
  cancelApplicationInterviewOffer,
  updateApplicationStatus,
  type ClinicApplication,
} from '@chairside/api';
import {
  formatApplicationEducation,
  formatApplicationResumeStatus,
  formatInterviewDateTime,
  getRoleTypeLabel,
  getSpecialtyLabel,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, LayoutAnimation, Platform, Pressable, Text, UIManager, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { ApplicationScreeningSection } from '@/components/clinic/ApplicationScreeningSection';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { ResumeViewButton } from '@/components/ui/ResumeViewButton';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { buildResumeFileName } from '@/lib/openResumePreview';
import {
  getClinicApplicationMessagesRoute,
  type ClinicApplicationReturnTarget,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ClinicApplicationCardProps = {
  application: ClinicApplication;
  returnTo?: ClinicApplicationReturnTarget;
  hasUnreadMessages?: boolean;
  onUpdated?: () => void;
  onShortlisted?: () => void;
  onScheduleInterview?: (application: ClinicApplication) => void;
};

function truncatePreview(text: string, maxLength = 88): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
}

export function ClinicApplicationCard({
  application,
  returnTo = 'applications-tab',
  hasUnreadMessages = false,
  onUpdated,
  onShortlisted,
  onScheduleInterview,
}: ClinicApplicationCardProps) {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const photoUri = useWorkerPhotoUri(application.worker_photo_storage_path);
  const isJob = application.post_type === 'job';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const interviewSummary = formatInterviewDateTime(
    application.interview_at,
    application.interview_duration_minutes,
  );

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    applicantName: {
      ...typography.body,
      fontWeight: '700',
      fontSize: 17,
    },
    applicantHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    applicantHeaderText: { flex: 1, gap: 2 },
    applicantTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    meta: typography.subtitle,
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
    toggle: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    toggleText: {
      ...typography.body,
      fontSize: 14,
      fontWeight: '600',
      color: colors.primary,
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
  }));

  const updateStatus = async (status: Parameters<typeof updateApplicationStatus>[1]) => {
    try {
      await updateApplicationStatus(application.id, status);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const cancelInterviewInvite = () => {
    Alert.alert(
      'Cancel interview invite?',
      'This withdraws the invitation and moves the applicant back to your shortlist.',
      [
        { text: 'Keep invite', style: 'cancel' },
        {
          text: 'Cancel invite',
          style: 'destructive',
          onPress: () => {
            void (async () => {
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
            })();
          },
        },
      ],
    );
  };

  const toggleExpanded = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
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

  const hasActions =
    application.status === 'applied' ||
    application.status === 'reviewed' ||
    application.status === 'in_progress' ||
    application.status === 'interview_offered' ||
    application.status === 'interview_scheduled';

  const handleMessage = () => {
    router.push(getClinicApplicationMessagesRoute(application.id, returnTo));
  };

  return (
    <View style={styles.card}>
      <View style={styles.applicantHeader}>
        <WorkerProfileAvatar
          displayName={application.worker_display_name}
          photoUri={photoUri}
          size={44}
        />
        <View style={styles.applicantHeaderText}>
          <View style={styles.applicantTitleRow}>
            {application.worker_display_name ? (
              <Text style={[styles.applicantName, { flex: 1 }]}>
                {application.worker_display_name}
              </Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            <ClinicApplicationStatusBadge status={application.status} />
          </View>
          {application.worker_address ? (
            <Text style={styles.meta}>{application.worker_address}</Text>
          ) : null}
        </View>
      </View>

      {jobMatch && matchContext ? (
        <BadgeRow>
          <MatchTierBadge
            breakdown={jobMatch}
            context={matchContext}
            subtitle={application.post_title}
            audience="clinic"
          />
        </BadgeRow>
      ) : null}

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
          </View>
        </View>
      ) : null}

      <OnboardingButton
        label={hasUnreadMessages ? 'Message applicant · New' : 'Message applicant'}
        variant="secondary"
        onPress={handleMessage}
      />

      {!expanded && application.cover_message ? (
        <Text style={styles.preview} numberOfLines={2}>
          {truncatePreview(application.cover_message)}
        </Text>
      ) : null}

      <Pressable
        style={styles.toggle}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        onPress={toggleExpanded}>
        <Text style={styles.toggleText}>{expanded ? 'Hide details' : 'View details'}</Text>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={colors.labelTertiary}
        />
      </Pressable>

      {expanded ? (
        <View style={styles.details}>
          {application.years_of_experience != null || application.education ? (
            <Text style={styles.meta}>
              {application.years_of_experience != null
                ? `${application.years_of_experience} yrs`
                : ''}
              {application.years_of_experience != null && application.education ? ' · ' : ''}
              {formatApplicationEducation(application.education)}
            </Text>
          ) : null}
          {application.role_type ? (
            <Text style={styles.meta}>{getRoleTypeLabel(application.role_type)}</Text>
          ) : null}
          {(application.software_used ?? []).length > 0 ? (
            <Text style={styles.meta}>
              Software: {(application.software_used ?? []).join(', ')}
            </Text>
          ) : null}
          {(application.practice_types ?? []).length > 0 ? (
            <Text style={styles.meta}>
              Specialties: {(application.practice_types ?? []).map(getSpecialtyLabel).join(', ')}
            </Text>
          ) : null}
          {application.cover_message ? (
            <Text style={styles.meta}>{application.cover_message}</Text>
          ) : null}
          {application.post_type === 'job' && application.screening ? (
            <ApplicationScreeningSection screening={application.screening} />
          ) : null}
          {application.interview_details ? (
            <Text style={styles.meta}>Interview details · {application.interview_details}</Text>
          ) : null}
          <Text style={styles.meta}>
            Resume · {formatApplicationResumeStatus(application.resume_storage_path)}
          </Text>
          {application.resume_storage_path ? (
            <ResumeViewButton
              storagePath={application.resume_storage_path}
              fileName={resumeFileName}
            />
          ) : null}

          {hasActions ? (
            <View style={styles.actions}>
              {application.status === 'applied' ? (
                <>
                  <View style={styles.actionsRow}>
                    <OnboardingButton
                      style={styles.action}
                      label="Mark viewed"
                      onPress={() => void updateStatus('reviewed')}
                    />
                    <OnboardingButton
                      style={styles.action}
                      label="Add to shortlist"
                      variant="secondary"
                      onPress={() => void updateStatus('in_progress')}
                    />
                  </View>
                  <View style={styles.actionsRow}>
                    <OnboardingButton
                      style={styles.action}
                      label="Not moving forward"
                      variant="destructive"
                      onPress={() => void updateStatus('rejected')}
                    />
                  </View>
                </>
              ) : null}
              {application.status === 'reviewed' ? (
                <View style={styles.actionsRow}>
                  <OnboardingButton
                    style={styles.action}
                    label="Add to shortlist"
                    onPress={() => void updateStatus('in_progress')}
                  />
                  <OnboardingButton
                    style={styles.action}
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </View>
              ) : null}
              {application.status === 'in_progress' ? (
                <View style={styles.actionsRow}>
                  <OnboardingButton
                    style={styles.action}
                    label="Schedule interview"
                    onPress={() => onScheduleInterview?.(application)}
                  />
                  <OnboardingButton
                    style={styles.action}
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </View>
              ) : null}
              {application.status === 'interview_offered' ? (
                <View style={styles.actionsRow}>
                  <OnboardingButton
                    style={styles.action}
                    label="Cancel invite"
                    variant="secondary"
                    onPress={cancelInterviewInvite}
                  />
                  <OnboardingButton
                    style={styles.action}
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </View>
              ) : null}
              {application.status === 'interview_scheduled' ? (
                <View style={styles.actionsRow}>
                  <OnboardingButton
                    style={styles.action}
                    label="Mark hired"
                    onPress={() => void updateStatus('selected')}
                  />
                  <OnboardingButton
                    style={styles.action}
                    label="Not moving forward"
                    variant="destructive"
                    onPress={() => void updateStatus('rejected')}
                  />
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
