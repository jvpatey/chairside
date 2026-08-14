import type { LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatApplicationStatus, formatJobPostCardMeta } from '@chairside/config';
import { Text, View } from 'react-native';

import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { formatPostedDateLabel } from '@/lib/dates';
import { fontSemibold, useThemedStyles } from '@/theme';

type RoleListingCardProps = {
  job: LiveJobPost;
  jobMatch?: JobMatchBreakdown | null;
  matchContext?: Partial<JobMatchContext>;
  /** Active application status for this job; omit when not applied / terminal. */
  applicationStatus?: string | null;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  distanceLabel?: string | null;
  onPress?: () => void;
  embedded?: boolean;
};

export function RoleListingCard({
  job,
  jobMatch,
  matchContext,
  applicationStatus,
  isSaved = false,
  onToggleSaved,
  distanceLabel,
  onPress,
  embedded = false,
}: RoleListingCardProps) {
  const featuredTreatment = useFeaturedListingTreatment();
  const locationBase = [job.clinic.city, job.clinic.province].filter(Boolean).join(', ');
  const location = distanceLabel
    ? locationBase
      ? `${locationBase} • ${distanceLabel}`
      : distanceLabel
    : locationBase;
  const detail = formatJobPostCardMeta(job);
  const postedLabel = formatPostedDateLabel(job.created_at) || null;
  const statusLabel = applicationStatus
    ? formatApplicationStatus(applicationStatus, 'job')
    : null;

  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      overflow: 'hidden',
      position: 'relative',
    },
    cardContent: {
      padding: spacing.md,
    },
    accessoryColumn: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    statusSaveRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
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
    wage: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const matchBadge =
    jobMatch && matchContext ? (
      <MatchTierBadge
        breakdown={jobMatch}
        context={matchContext}
        subtitle={job.title}
        showProfileHint
      />
    ) : null;

  const showStatusSaveRow = Boolean(statusLabel);
  const accessory =
    job.has_priority_listing || matchBadge || (!showStatusSaveRow && onToggleSaved) ? (
      <View style={styles.accessoryColumn}>
        {job.has_priority_listing ? <FeaturedListingBadge /> : null}
        {matchBadge}
        {!showStatusSaveRow && onToggleSaved ? (
          <SavePostButton isSaved={isSaved} onToggle={onToggleSaved} size={20} />
        ) : null}
      </View>
    ) : null;

  const isFeatured = job.has_priority_listing;

  return (
    <SurfaceCard
      variant={embedded ? 'inner' : 'default'}
      onPress={onPress}
      padding="none"
      style={[styles.card, isFeatured ? featuredTreatment.cardStyle : null]}
      accentRailColor={isFeatured ? featuredTreatment.railColor : undefined}>
      <View style={styles.cardContent}>
        <ClinicPostHeader
          layout="split"
          clinicName={job.clinic.clinic_name}
          logoStoragePath={job.clinic.logo_storage_path}
          title={job.title}
          location={location || null}
          detail={detail || null}
          postedLabel={postedLabel}
          textFooter={
            job.wage_range ? <Text style={styles.wage}>{job.wage_range}</Text> : undefined
          }
          accessory={accessory}
          stackedAccessory
          preDividerRow={
            showStatusSaveRow ? (
              <View style={styles.statusSaveRow}>
                <Text style={styles.statusText} numberOfLines={1}>
                  Status:{' '}
                  <Text style={styles.statusValue}>{statusLabel}</Text>
                </Text>
                {onToggleSaved ? (
                  <SavePostButton isSaved={isSaved} onToggle={onToggleSaved} size={20} />
                ) : null}
              </View>
            ) : undefined
          }
        />
      </View>
    </SurfaceCard>
  );
}
