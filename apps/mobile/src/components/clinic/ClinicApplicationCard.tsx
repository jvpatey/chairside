import { getApplicantDisplayName, type ClinicApplication } from '@chairside/api';
import {
  formatApplicationDate,
  formatRoleTypesLabel,
  hasClinicWorkerCrmContent,
  resolveWorkerRoleTypes,
} from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ApplicantPostHeader } from '@/components/clinic/ApplicantPostHeader';
import { ClinicWorkerCrmBadges } from '@/components/clinic/ClinicWorkerCrmSheet';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { ClinicApplicationStatusBadge } from '@/components/matching/ApplicationStatusBadge';
import { ApplicationCardBadge } from '@/components/ui/ApplicationCardBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useApplicationTabBadge } from '@/contexts/ApplicationTabBadgeContext';
import {
  getApplicationMatchDisplayContext,
  parseApplicationJobMatch,
} from '@/lib/matchDisplay';
import { getClinicApplicantBadgeVisibility } from '@/lib/applicationPipeline';
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

function truncatePreview(text: string, maxLength = 88): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength - 1).trim()}…`;
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
  const { showNewBadge, showStatusBadge } = getClinicApplicantBadgeVisibility(
    application,
    hasNewApplication,
  );
  const workerDeleted = application.worker_account_deleted;
  const crmRecord = application.clinic_crm;

  const applicantName = getApplicantDisplayName(application);
  const workerRoleLabel = formatRoleTypesLabel(resolveWorkerRoleTypes(application));
  const experienceLabel =
    application.years_of_experience != null
      ? `${application.years_of_experience} ${
          application.years_of_experience === 1 ? 'year' : 'years'
        } experience`
      : null;
  const appliedDateLabel = formatApplicationDate(application.created_at);
  const appliedLabel = appliedDateLabel ? `Applied ${appliedDateLabel}` : null;

  const styles = useThemedStyles(({ spacing, typography }) => ({
    preview: {
      ...typography.subtitle,
      fontStyle: 'italic',
    },
    trailingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    unread: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const openDetail = () => {
    router.push(getClinicApplicationRoute(application.id, returnTo, roleJobId));
  };

  return (
    <SurfaceCard padding="md" gap onPress={openDetail}>
      <ApplicantPostHeader
        layout="split"
        displayName={applicantName}
        photoStoragePath={workerDeleted ? null : application.worker_photo_storage_path}
        eyebrow={workerRoleLabel}
        title={applicantName}
        location={workerDeleted ? null : application.worker_address}
        detail={experienceLabel}
        postedLabel={appliedLabel}
        avatarSize={44}
        accessory={
          <View style={{ alignItems: 'flex-end', gap: 8 }}>
            {showNewBadge ? <ApplicationCardBadge /> : null}
            {showStatusBadge ? (
              <ClinicApplicationStatusBadge
                status={application.status}
                postType={application.post_type}
                applicationKitRequestedAt={application.application_kit_requested_at}
                applicationKitSubmittedAt={application.application_kit_submitted_at}
                statusClosedBy={application.status_closed_by}
              />
            ) : null}
          </View>
        }
        detailAccessory={
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
        textFooter={
          hasClinicWorkerCrmContent(crmRecord) ? (
            <ClinicWorkerCrmBadges record={crmRecord} compact />
          ) : null
        }
      />

      {application.cover_message?.trim() ? (
        <Text style={styles.preview} numberOfLines={2}>
          {truncatePreview(application.cover_message)}
        </Text>
      ) : null}

      <View style={styles.trailingRow}>
        {hasUnreadMessages ? <Text style={styles.unread}>New message</Text> : null}
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      </View>
    </SurfaceCard>
  );
}
