import { isClinicSummaryGroup, type LiveJobPost } from '@chairside/api';
import { formatJobPostRoleMeta } from '@chairside/config';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BadgeRow } from '@/components/ui/BadgeRow';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { PillBadge } from '@/components/ui/PillBadge';
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
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type RoleListingCardProps = {
  job: LiveJobPost;
  /** Active application status for this job; omit when not applied / terminal. */
  applicationStatus?: string | null;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  distanceLabel?: string | null;
  onPress?: () => void;
  embedded?: boolean;
};

/** Signature role card — title first; role-blue employment line; clinic secondary. */
export function RoleListingCard({
  job,
  applicationStatus = null,
  isSaved = false,
  onToggleSaved: _onToggleSaved,
  distanceLabel,
  onPress,
  embedded = false,
}: RoleListingCardProps) {
  const { colors } = useTheme();
  const { isCompact } = useResponsiveLayout();
  const featuredTreatment = useFeaturedListingTreatment();
  const logoStoragePath = resolveWorkerPostLogoStoragePath(job);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const location = formatWorkerListingCardLocation(job, distanceLabel);
  const roleMeta = formatJobPostRoleMeta(job);
  const clinicName = job.clinic.clinic_name;
  const isGroup = isClinicSummaryGroup(job.clinic);
  const hasApplied = Boolean(applicationStatus);

  const metaRows = buildRoleListingMetaRows({
    location,
    compensation: job.compensation,
    postedAt: job.created_at,
  });

  const styles = useThemedStyles(({ colors }) => ({
    stretchCard: {
      overflow: 'hidden' as const,
      position: 'relative' as const,
    },
    subtitleStack: {
      gap: 2,
    },
    roleLine: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
    },
    clinicLine: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
  }));

  const isFeatured = job.has_priority_listing;
  const trailingBadges =
    isFeatured || hasApplied || isSaved ? (
      <BadgeRow>
        {isFeatured ? <FeaturedListingBadge size="sm" /> : null}
        {isSaved ? (
          <PillBadge
            label="Saved"
            color={colors.labelSecondary}
            backgroundColor={colors.fillSubtle}
            size="xs"
          />
        ) : null}
        {hasApplied ? (
          <PillBadge
            label="Applied"
            color={colors.primary}
            backgroundColor={colors.primarySubtle}
            size="xs"
          />
        ) : null}
      </BadgeRow>
    ) : null;
  const stackBadges = isCompact && trailingBadges != null;

  return (
    <SurfaceCard
      variant={embedded ? 'inner' : 'default'}
      onPress={onPress}
      padding="none"
      style={styles.stretchCard}
      cardStyle={isFeatured ? featuredTreatment.cardStyle : undefined}>
      <BrowseListRow
        avatar={
          <ClinicLogoAvatar clinicName={clinicName} logoUri={logoUri} size={44} />
        }
        title={job.title}
        subtitle={
          <View style={styles.subtitleStack}>
            {roleMeta ? (
              <Text style={styles.roleLine} numberOfLines={1}>
                {roleMeta}
              </Text>
            ) : null}
            <Text style={styles.clinicLine} numberOfLines={1}>
              {isGroup ? `${clinicName} · Group` : clinicName}
            </Text>
            {stackBadges ? trailingBadges : null}
          </View>
        }
        metaRows={metaRows}
        topTrailing={stackBadges ? null : trailingBadges}
        // SurfaceCard owns the row press — avoid nested <button> on web.
        showChevron={Boolean(onPress)}
      />
    </SurfaceCard>
  );
}
