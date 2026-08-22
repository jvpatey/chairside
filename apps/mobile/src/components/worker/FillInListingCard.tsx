import type { LiveShiftPost } from '@chairside/api';
import { Text, View } from 'react-native';

import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { useFeaturedListingTreatment } from '@/components/worker/featuredListingTreatment';
import { buildPostedByLabel } from '@/hooks/useClinicActingContext';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { formatPostedDateLabel } from '@/lib/dates';
import {
  formatWorkerPostLocation,
  resolveWorkerPostLogoStoragePath,
} from '@/lib/workerPostLocation';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

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
  isSaved = false,
  onToggleSaved,
  onPress,
  accent,
  embedded = false,
}: FillInListingCardProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const featuredTreatment = useFeaturedListingTreatment(resolvedAccent);
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const location = formatWorkerPostLocation(shift, distanceLabel);
  const roleTitle = formatShiftPostRoleTitle(shift.role_type);
  const detail = formatShiftPostMeta(shift);
  const postedLabel =
    buildPostedByLabel({
      postedAt: shift.created_at,
      postedByDisplayName: shift.posted_by_display_name,
      postedByTitle: shift.posted_by_title,
      formatDateLabel: formatPostedDateLabel,
    }) ?? null;

  const styles = useThemedStyles(({ spacing }) => ({
    cardContent: {
      padding: spacing.md,
    },
    accessoryColumn: {
      alignItems: 'flex-end',
      gap: spacing.xs,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: brandColor,
    },
  }));

  const accessory = (
    <View style={styles.accessoryColumn}>
      {shift.has_priority_listing ? <FeaturedListingBadge accent={resolvedAccent} /> : null}
      <ShiftUrgencyBadge urgency={shift.urgency} />
      {onToggleSaved ? (
        <SavePostButton isSaved={isSaved} onToggle={onToggleSaved} size={20} />
      ) : null}
    </View>
  );

  const isFeatured = shift.has_priority_listing;

  return (
    <SurfaceCard
      variant={embedded ? 'inner' : 'default'}
      onPress={onPress}
      padding="none"
      style={isFeatured ? featuredTreatment.cardStyle : undefined}
      accentRailColor={isFeatured ? featuredTreatment.railColor : undefined}>
      <View style={styles.cardContent}>
        <ClinicPostHeader
          layout="split"
          clinicName={shift.clinic.clinic_name}
          logoStoragePath={resolveWorkerPostLogoStoragePath(shift)}
          title={roleTitle}
          location={location || null}
          detail={detail || null}
          postedLabel={postedLabel}
          textFooter={
            shift.compensation ? (
              <Text style={styles.compensation}>{shift.compensation}</Text>
            ) : undefined
          }
          avatarSize={44}
          accessory={accessory}
          stackedAccessory
        />
      </View>
    </SurfaceCard>
  );
}
