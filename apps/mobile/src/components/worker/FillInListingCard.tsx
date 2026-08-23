import { isClinicSummaryGroup, type LiveShiftPost } from '@chairside/api';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ListingClinicSubtitle } from '@/components/ui/ListingMetaIconRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
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

  const styles = useThemedStyles(() => ({
    stretchCard: {
      overflow: 'hidden',
    },
  }));

  const isFeatured = shift.has_priority_listing;

  return (
    <SurfaceCard
      variant={embedded ? 'inner' : 'default'}
      onPress={onPress}
      padding="none"
      style={[styles.stretchCard, isFeatured ? featuredTreatment.cardStyle : null]}
      accentRailColor={isFeatured ? featuredTreatment.railColor : undefined}>
      <BrowseListRow
        avatar={
          <ClinicLogoAvatar clinicName={shift.clinic.clinic_name} logoUri={logoUri} size={44} />
        }
        title={roleTitle}
        subtitle={
          <ListingClinicSubtitle
            name={shift.clinic.clinic_name}
            isGroup={isClinicSummaryGroup(shift.clinic)}
          />
        }
        metaRows={metaRows}
        onPress={onPress}
        showChevron={Boolean(onPress)}
      />
    </SurfaceCard>
  );
}
