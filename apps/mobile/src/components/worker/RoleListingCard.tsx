import { isClinicSummaryGroup, type LiveJobPost } from '@chairside/api';
import type { JobMatchBreakdown, JobMatchContext } from '@chairside/core';
import { formatJobPostRoleMeta } from '@chairside/config';
import { View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { MatchTierBadge } from '@/components/matching/MatchTierBadge';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ListingClinicSubtitle } from '@/components/ui/ListingMetaIconRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { buildRoleListingMetaRows } from '@/lib/listingCardDisplay';
import {
  formatWorkerListingCardLocation,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import { useThemedStyles } from '@/theme';

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
  applicationStatus: _applicationStatus,
  isSaved: _isSaved = false,
  onToggleSaved: _onToggleSaved,
  distanceLabel,
  onPress,
  embedded = false,
}: RoleListingCardProps) {
  const { isCompact } = useResponsiveLayout();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoStoragePath = resolveWorkerPostLogoStoragePath(job);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const location = formatWorkerListingCardLocation(job, distanceLabel);
  const roleMeta = formatJobPostRoleMeta(job);
  const metaRows = buildRoleListingMetaRows({
    location,
    roleMeta,
    postedAt: job.created_at,
  });

  const styles = useThemedStyles(({ spacing }) => ({
    stretchCard: {
      overflow: 'hidden',
      position: 'relative',
    },
    subtitleStack: {
      gap: spacing.xs,
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

  const isFeatured = job.has_priority_listing;
  const badgeRow =
    isFeatured || matchBadge ? (
      <BadgeRow>
        {isFeatured ? <FeaturedListingBadge size="sm" /> : null}
        {matchBadge}
      </BadgeRow>
    ) : null;
  /** Phone / narrow: stack badges under the clinic line so the title keeps full width. */
  const stackBadges = isCompact && badgeRow != null;

  return (
    <SurfaceCard
      variant={embedded ? 'inner' : 'default'}
      onPress={onPress}
      padding="none"
      style={styles.stretchCard}
      cardStyle={isFeatured ? featuredTreatment.cardStyle : undefined}
      accentRailColor={isFeatured ? featuredTreatment.railColor : undefined}>
      <BrowseListRow
        avatar={
          <ClinicLogoAvatar clinicName={job.clinic.clinic_name} logoUri={logoUri} size={48} />
        }
        title={job.title}
        subtitle={
          stackBadges ? (
            <View style={styles.subtitleStack}>
              <ListingClinicSubtitle
                name={job.clinic.clinic_name}
                isGroup={isClinicSummaryGroup(job.clinic)}
              />
              {badgeRow}
            </View>
          ) : (
            <ListingClinicSubtitle
              name={job.clinic.clinic_name}
              isGroup={isClinicSummaryGroup(job.clinic)}
            />
          )
        }
        metaRows={metaRows}
        topTrailing={stackBadges ? null : badgeRow}
        onPress={onPress}
        showChevron={Boolean(onPress)}
      />
    </SurfaceCard>
  );
}
