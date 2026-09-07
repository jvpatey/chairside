import { isClinicSummaryGroup, type LiveShiftPost } from '@chairside/api';
import { View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ListingClinicSubtitle } from '@/components/ui/ListingMetaIconRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { buildFillInListingMetaRows } from '@/lib/listingCardDisplay';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import {
  formatWorkerListingCardLocation,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import { useThemedStyles, type GradientAccent } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  distanceLabel?: string | null;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  onPress?: () => void;
  accent?: GradientAccent;
  embedded?: boolean;
};

export function FillInListingCard({
  shift,
  distanceLabel,
  isSaved: _isSaved = false,
  onToggleSaved: _onToggleSaved,
  onPress,
  accent,
  embedded = false,
}: FillInListingCardProps) {
  const { isCompact } = useResponsiveLayout();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const featuredTreatment = useFeaturedListingTreatment(resolvedAccent);
  const logoStoragePath = resolveWorkerPostLogoStoragePath(shift);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const location = formatWorkerListingCardLocation(shift, distanceLabel);
  const roleTitle = formatShiftPostRoleTitle(shift.role_type);
  const shiftMeta = formatShiftPostMeta(shift);
  const metaRows = buildFillInListingMetaRows({
    location,
    shiftMeta,
    postedAt: shift.created_at,
  });

  const styles = useThemedStyles(({ spacing }) => ({
    stretchCard: {
      overflow: 'hidden',
    },
    subtitleStack: {
      gap: spacing.xs,
    },
  }));

  const isFeatured = shift.has_priority_listing;
  const featuredBadge = isFeatured ? (
    <FeaturedListingBadge accent={resolvedAccent} size="sm" />
  ) : null;
  const stackBadge = isCompact && featuredBadge != null;

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
          <ClinicLogoAvatar clinicName={shift.clinic.clinic_name} logoUri={logoUri} size={44} />
        }
        title={roleTitle}
        subtitle={
          stackBadge ? (
            <View style={styles.subtitleStack}>
              <ListingClinicSubtitle
                name={shift.clinic.clinic_name}
                isGroup={isClinicSummaryGroup(shift.clinic)}
              />
              {featuredBadge}
            </View>
          ) : (
            <ListingClinicSubtitle
              name={shift.clinic.clinic_name}
              isGroup={isClinicSummaryGroup(shift.clinic)}
            />
          )
        }
        metaRows={metaRows}
        topTrailing={stackBadge ? null : featuredBadge}
        onPress={onPress}
        showChevron={Boolean(onPress)}
      />
    </SurfaceCard>
  );
}
