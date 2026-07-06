import { getApplicantDisplayName, type ClinicApplication } from '@chairside/api';
import {
  formatApplicationEducation,
  formatInterviewDateTime,
  formatRoleTypesLabel,
  resolveWorkerRoleTypes,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { WorkerProfileAvatar } from '@/components/worker/WorkerProfileAvatar';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import { useWorkerPhotoUri } from '@/hooks/useWorkerPhotoUri';
import { formatRelativeApplicationAge } from '@/lib/dates';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import {
  getClinicApplicationRoute,
  type ClinicApplicationReturnTarget,
} from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

type ClinicApplicationCardProps = {
  application: ClinicApplication;
  returnTo?: ClinicApplicationReturnTarget;
  roleJobId?: string;
  hasUnreadMessages?: boolean;
};

function buildQualificationsLine(application: ClinicApplication, roleJobId?: string): string | null {
  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} ${
          application.years_of_experience === 1 ? 'year' : 'years'
        } experience`
      : null;
  const educationLabel = formatApplicationEducation(application.education);
  const roleLabel = roleJobId
    ? null
    : formatRoleTypesLabel(resolveWorkerRoleTypes(application));

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
    application.status === 'interview_scheduled'
      ? application.interview_at
      : application.status === 'interview_offered'
        ? application.interview_proposed_at
        : null;
  const interviewDuration =
    application.status === 'interview_scheduled'
      ? application.interview_duration_minutes
      : application.interview_proposed_duration_minutes;
  const interviewSummary = interviewAt
    ? formatInterviewDateTime(interviewAt, interviewDuration)
    : null;
  const interviewLabel = interviewSummary ? `Interview ${interviewSummary}` : null;

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

export function ClinicApplicationCard({
  application,
  returnTo = 'applications-tab',
  roleJobId,
  hasUnreadMessages = false,
}: ClinicApplicationCardProps) {
  const { colors } = useTheme();
  const { isApplicationHighlighted } = useApplicationTabBadge();
  const isJob = application.post_type === 'job';
  const jobMatch = isJob ? parseApplicationJobMatch(application) : null;
  const matchContext = isJob ? getApplicationMatchDisplayContext(application) : null;
  const hasNewApplication = isApplicationHighlighted(application);
  const workerDeleted = application.worker_account_deleted;

  const applicantName = getApplicantDisplayName(application);
  const photoUri = useWorkerPhotoUri(
    workerDeleted ? null : application.worker_photo_storage_path,
  );
  const qualificationsLine = buildQualificationsLine(application, roleJobId);
  const contextLine = buildContextLine(application, hasUnreadMessages, workerDeleted);

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
    matchSlot: {
      flexShrink: 0,
      paddingTop: 1,
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
    router.push(getClinicApplicationRoute(application.id, returnTo, roleJobId));
  };

  return (
    <SurfaceCard padding="md" onPress={openDetail}>
      <View style={styles.row}>
        <WorkerProfileAvatar displayName={applicantName} photoUri={photoUri} size={44} />
        <View style={styles.body}>
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

          <BadgeRow>
            <ClinicApplicationStatusBadge
              status={application.status}
              postType={application.post_type}
              applicationKitRequestedAt={application.application_kit_requested_at}
              applicationKitSubmittedAt={application.application_kit_submitted_at}
              statusClosedBy={application.status_closed_by}
            />
            {hasNewApplication ? <ApplicationCardBadge /> : null}
          </BadgeRow>

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
        <View style={styles.chevron}>
          <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
        </View>
      </View>
    </SurfaceCard>
  );
}
