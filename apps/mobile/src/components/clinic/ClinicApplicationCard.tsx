import { getApplicantDisplayName, type ClinicApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatClinicApplicationStatus,
  formatClinicScreeningStatus,
  formatClinicShiftApplicationStatus,
  formatInterviewDateTime,
  formatRoleTypesLabel,
  resolveWorkerRoleTypes,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { CardSectionDivider } from '@/components/ui/CardTitleSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatRelativeApplicationAge } from '@/lib/dates';
import { isPastShiftDate } from '@/lib/fillInFilters';
import { formatConfirmedFillInStatusLabel } from '@/lib/fillInHistoryDisplay';
import { getFirstName } from '@/lib/greeting';
import { getApplicationMatchDisplayContext, parseApplicationJobMatch } from '@/lib/matchDisplay';
import { getClinicApplicationRoute, type ClinicApplicationReturnTarget } from '@/lib/routing';
import { getScreeningOutcomeLabel } from '@/lib/screeningTriage';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type ClinicApplicationCardProps = {
  application: ClinicApplication;
  returnTo?: ClinicApplicationReturnTarget;
  roleJobId?: string;
  /** When set, Back restores Applications split view with this role selected. */
  selectJobId?: string;
  hasUnreadMessages?: boolean;
  embedded?: boolean;
};

function buildQualificationsLine(
  application: ClinicApplication,
  roleJobId?: string,
): string | null {
  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} ${
          application.years_of_experience === 1 ? 'year' : 'years'
        } experience`
      : null;
  const educationLabel = formatApplicationEducation(application.education);
  const roleLabel = roleJobId ? null : formatRoleTypesLabel(resolveWorkerRoleTypes(application));

  return [experienceLabel, educationLabel, roleLabel].filter(Boolean).join(' · ') || null;
}

function buildContextLine(
  application: ClinicApplication,
  hasUnreadMessages: boolean,
  workerDeleted: boolean,
): string | null {
  const relativeAge = formatRelativeApplicationAge(application.created_at);
  const appliedLabel = relativeAge ? `Applied ${relativeAge}` : null;

  const interviewAt =
    application.status === 'interview_scheduled' || application.status === 'interview_offered'
      ? application.interview_at
      : null;
  const interviewDuration =
    application.status === 'interview_scheduled' || application.status === 'interview_offered'
      ? application.interview_duration_minutes
      : null;
  const interviewSummary = interviewAt
    ? formatInterviewDateTime(interviewAt, interviewDuration)
    : null;
  let interviewLabel = interviewSummary ? `Interview ${interviewSummary}` : null;
  if (
    application.status === 'interview_offered' &&
    application.interview_proposed_by === 'worker' &&
    application.interview_proposed_at
  ) {
    const suggested = formatInterviewDateTime(
      application.interview_proposed_at,
      application.interview_proposed_duration_minutes,
    );
    if (suggested) {
      const firstName =
        getFirstName(application.worker_display_name) ||
        application.worker_display_name?.trim() ||
        'Applicant';
      interviewLabel = `${firstName} suggested · ${suggested}`;
    }
  }

  const locationLabel = workerDeleted ? null : application.worker_address?.trim() || null;

  return [
    interviewLabel ? interviewLabel : null,
    appliedLabel,
    locationLabel,
    hasUnreadMessages ? 'New message' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function getClinicApplicationStatusLabel(application: ClinicApplication): string {
  if (application.status === 'screening_submitted') {
    return formatClinicScreeningStatus({
      status: application.status,
      post_type: application.post_type,
      application_kit_requested_at: application.application_kit_requested_at,
      application_kit_submitted_at: application.application_kit_submitted_at,
    });
  }
  if (application.post_type === 'shift') {
    if (
      (application.status === 'hired' || application.status === 'selected') &&
      isPastShiftDate(application.shift_date)
    ) {
      return formatConfirmedFillInStatusLabel(true);
    }
    return formatClinicShiftApplicationStatus({
      status: application.status,
      status_closed_by: application.status_closed_by,
    });
  }
  return formatClinicApplicationStatus(application.status, application.post_type);
}

export function ClinicApplicationCard({
  application,
  returnTo = 'applications-tab',
  roleJobId,
  selectJobId,
  hasUnreadMessages = false,
  embedded = false,
}: ClinicApplicationCardProps) {
  const { colors } = useTheme();
  const { isApplicationHighlighted } = useApplicationTabBadge();
  const isJob = application.post_type === 'job';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const hasNewApplication = isApplicationHighlighted(application);
  const workerDeleted = application.worker_account_deleted;

  const applicantName = getApplicantDisplayName(application);
  const photoUri = useWorkerPhotoUri(workerDeleted ? null : application.worker_photo_storage_path);
  const qualificationsLine = buildQualificationsLine(application, roleJobId);
  const contextLine = buildContextLine(application, hasUnreadMessages, workerDeleted);
  const postContextLine = !roleJobId ? application.post_title?.trim() || null : null;
  const statusLabel = getClinicApplicationStatusLabel(application);
  const screeningOutcome =
    application.status === 'screening_submitted' && !workerDeleted
      ? application.screening?.outcome ?? null
      : null;
  const outcomeLabel =
    screeningOutcome === 'flagged'
      ? 'Screening flagged'
      : getScreeningOutcomeLabel(screeningOutcome);
  const showMatchBadge = Boolean(jobMatch && matchContext);
  const showQualifications = Boolean(qualificationsLine);
  const stackOutcomeBadge = Platform.OS !== 'web';
  const stackContextLine = stackOutcomeBadge && Boolean(contextLine);
  const hasFooterMeta = showQualifications || (!stackContextLine && Boolean(contextLine));

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: spacing.sm,
    },
    headerStack: {
      gap: spacing.xs,
    },
    identityBlock: {
      gap: 2,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      minWidth: 0,
    },
    name: {
      flex: 1,
      minWidth: 0,
      ...typography.body,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: colors.labelPrimary,
    },
    postContext: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      color: colors.labelSecondary,
    },
    matchSlot: {
      flexShrink: 0,
      paddingTop: 1,
    },
    statusBlock: {
      gap: spacing.sm,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
      flexWrap: 'wrap',
    },
    statusText: {
      flexShrink: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    statusValue: {
      color: colors.labelPrimary,
    },
    outcomeBadge: {
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 999,
      borderWidth: 1,
    },
    outcomeBadgePass: {
      backgroundColor: `${colors.success}14`,
      borderColor: `${colors.success}33`,
    },
    outcomeBadgeFlagged: {
      backgroundColor: `${colors.warning}14`,
      borderColor: `${colors.warning}40`,
    },
    outcomeBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.labelPrimary,
    },
    detailsBlock: {
      gap: spacing.xs,
    },
    details: {
      gap: spacing.xs,
    },
    detailsAfterDivider: {
      paddingTop: spacing.xs,
    },
    qualifications: {
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.labelPrimary,
    },
    context: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    chevron: {
      paddingTop: 2,
    },
  }));

  const outcomeBadge = outcomeLabel ? (
    <View
      style={[
        styles.outcomeBadge,
        screeningOutcome === 'flagged' ? styles.outcomeBadgeFlagged : styles.outcomeBadgePass,
      ]}>
      <Text style={styles.outcomeBadgeText}>{outcomeLabel}</Text>
    </View>
  ) : null;

  const openDetail = () => {
    router.push(getClinicApplicationRoute(application.id, returnTo, roleJobId, selectJobId));
  };

  return (
    <SurfaceCard variant={embedded ? 'inner' : 'default'} padding="md" onPress={openDetail}>
      <View style={styles.row}>
        <WorkerProfileAvatar displayName={applicantName} photoUri={photoUri} size={44} />
        <View style={styles.body}>
          <View style={styles.headerStack}>
            <View style={styles.identityBlock}>
              <View style={styles.titleRow}>
                <Text style={styles.name} numberOfLines={2}>
                  {applicantName}
                </Text>
                {showMatchBadge && jobMatch && matchContext ? (
                  <View style={styles.matchSlot}>
                    <MatchTierBadge
                      breakdown={jobMatch}
                      context={matchContext}
                      subtitle={application.post_title}
                      audience="clinic"
                    />
                  </View>
                ) : null}
              </View>
              {postContextLine ? (
                <Text style={styles.postContext} numberOfLines={1}>
                  {postContextLine}
                </Text>
              ) : null}
            </View>

            <View style={styles.statusBlock}>
              <View style={styles.statusRow}>
                <Text style={styles.statusText} numberOfLines={1}>
                  Status: <Text style={styles.statusValue}>{statusLabel}</Text>
                </Text>
                {!stackOutcomeBadge ? outcomeBadge : null}
                {hasNewApplication ? <ApplicationCardBadge /> : null}
              </View>
              {stackOutcomeBadge ? outcomeBadge : null}
              {stackContextLine ? (
                <Text style={styles.context} numberOfLines={2}>
                  {contextLine}
                </Text>
              ) : null}
            </View>
          </View>

          {hasFooterMeta ? (
            <View style={styles.detailsBlock}>
              {showQualifications ? <CardSectionDivider /> : null}
              <View style={[styles.details, showQualifications && styles.detailsAfterDivider]}>
                {showQualifications ? (
                  <Text style={styles.qualifications} numberOfLines={2}>
                    {qualificationsLine}
                  </Text>
                ) : null}
                {!stackContextLine && contextLine ? (
                  <Text style={styles.context} numberOfLines={2}>
                    {contextLine}
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
        </View>
      </View>
    </SurfaceCard>
  );
}
