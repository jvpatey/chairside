import { isClinicSummaryGroup, type LiveShiftPost } from '@chairside/api';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { LISTING_META_ICONS } from '@/lib/listingCardDisplay';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import {
  formatWorkerListingCardLocation,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import { fontSemibold, useThemedStyles, type GradientAccent } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  distanceLabel?: string | null;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  onPress?: () => void;
  accent?: GradientAccent;
  embedded?: boolean;
};

/** Signature fill-in card — when is dominant; clinic/place secondary. */
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
  const resolvedAccent = accent ?? tabAccent ?? 'primary';
  const featuredTreatment = useFeaturedListingTreatment(resolvedAccent);
  const logoStoragePath = resolveWorkerPostLogoStoragePath(shift);
  const logoUri = useClinicLogoUri(logoStoragePath);
  const location = formatWorkerListingCardLocation(shift, distanceLabel);
  const roleTitle = formatShiftPostRoleTitle(shift.role_type);
  const whenLabel = formatShiftPostMeta(shift);
  const pay = shift.compensation?.trim() || null;
  const clinicName = shift.clinic.clinic_name;
  const isGroup = isClinicSummaryGroup(shift.clinic);

  const styles = useThemedStyles(({ colors }) => ({
    stretchCard: {
      overflow: 'hidden' as const,
    },
    roleLine: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: resolvedAccent === 'primary' ? colors.primary : colors.secondary,
    },
    clinicLine: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    subtitleStack: {
      gap: 2,
    },
  }));

  const isFeatured = shift.has_priority_listing;
  const featuredBadge = isFeatured ? (
    <FeaturedListingBadge accent={resolvedAccent} size="sm" />
  ) : null;

  const metaRows = [
    location
      ? { icon: LISTING_META_ICONS.location, label: location }
      : null,
    pay ? { icon: 'cash-outline' as const, label: pay } : null,
  ].filter((row): row is { icon: typeof LISTING_META_ICONS.location | 'cash-outline'; label: string } =>
    row != null,
  );

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
        title={whenLabel}
        subtitle={
          <View style={styles.subtitleStack}>
            <Text style={styles.roleLine} numberOfLines={1}>
              {roleTitle}
            </Text>
            <Text style={styles.clinicLine} numberOfLines={1}>
              {isGroup ? `${clinicName} · Group` : clinicName}
            </Text>
            {isCompact && featuredBadge ? featuredBadge : null}
          </View>
        }
        metaRows={metaRows}
        topTrailing={isCompact ? null : featuredBadge}
        showChevron={Boolean(onPress)}
      />
    </SurfaceCard>
  );
}
