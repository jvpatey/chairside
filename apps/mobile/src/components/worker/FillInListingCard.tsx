import type { LiveShiftPost } from '@chairside/api';
import { Text, View } from 'react-native';

import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { FeaturedListingBadge } from '@/components/worker/FeaturedListingBadge';
import { SavePostButton } from '@/components/worker/SavePostButton';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useTabAtmosphereAccent } from '@/contexts/TabAtmosphereContext';
import { useTheme, useThemedStyles, type GradientAccent } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  distanceLabel?: string | null;
  isSaved?: boolean;
  onToggleSaved?: () => void;
  onPress?: () => void;
  accent?: GradientAccent;
};

export function FillInListingCard({
  shift,
  distanceLabel,
  isSaved = false,
  onToggleSaved,
  onPress,
  accent,
}: FillInListingCardProps) {
  const { colors } = useTheme();
  const tabAccent = useTabAtmosphereAccent();
  const resolvedAccent = accent ?? tabAccent;
  const brandColor = resolvedAccent === 'secondary' ? colors.secondary : colors.primary;
  const locationBase = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');
  const location = distanceLabel
    ? locationBase
      ? `${locationBase} • ${distanceLabel}`
      : distanceLabel
    : locationBase;
  const roleTitle = formatShiftPostRoleTitle(shift.role_type);
  const detail = formatShiftPostMeta(shift);

  const styles = useThemedStyles(({ spacing }) => ({
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
      {shift.has_priority_listing ? <FeaturedListingBadge /> : null}
      <ShiftUrgencyBadge urgency={shift.urgency} />
      {onToggleSaved ? (
        <SavePostButton isSaved={isSaved} onToggle={onToggleSaved} size={20} />
      ) : null}
    </View>
  );

  return (
    <SurfaceCard onPress={onPress}>
      <ClinicPostHeader
        layout="split"
        clinicName={shift.clinic.clinic_name}
        logoStoragePath={shift.clinic.logo_storage_path}
        title={roleTitle}
        location={location || null}
        detail={detail || null}
        textFooter={
          shift.compensation ? (
            <Text style={styles.compensation}>{shift.compensation}</Text>
          ) : undefined
        }
        avatarSize={44}
        accessory={accessory}
        stackedAccessory
      />
    </SurfaceCard>
  );
}
