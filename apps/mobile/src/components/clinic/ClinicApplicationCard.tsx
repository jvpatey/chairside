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
import { Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { CardSectionDivider } from '@/components/ui/CardTitleSection';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatRelativeApplicationAge } from '@/lib/dates';
import { getFirstName } from '@/lib/greeting';
import { getApplicationMatchDisplayContext, parseApplicationJobMatch } from '@/lib/matchDisplay';
import { getClinicApplicationRoute, type ClinicApplicationReturnTarget } from '@/lib/routing';
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
  const hasDetailsBelow = Boolean(qualificationsLine || contextLine);

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
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minWidth: 0,
    },
    statusText: {
      flex: 1,
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
    detailsBlock: {
      gap: spacing.xs,
    },
    details: {
      gap: spacing.xs,
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
                {jobMatch && matchContext ? (
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

            <View style={styles.statusRow}>
              <Text style={styles.statusText} numberOfLines={1}>
                Status: <Text style={styles.statusValue}>{statusLabel}</Text>
              </Text>
              {hasNewApplication ? <ApplicationCardBadge /> : null}
            </View>
          </View>

          {hasDetailsBelow ? (
            <View style={styles.detailsBlock}>
              <CardSectionDivider />
              <View style={styles.details}>
                {qualificationsLine ? (
                  <Text style={styles.qualifications} numberOfLines={2}>
                    {qualificationsLine}
                  </Text>
                ) : null}
                {contextLine ? (
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
