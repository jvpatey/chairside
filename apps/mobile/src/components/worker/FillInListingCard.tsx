import type { LiveShiftPost } from '@chairside/api';
import { Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import type { ListingLayout } from '@/components/ui/BrowseListRow';
import { useThemedStyles } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  layout?: ListingLayout;
  onPress?: () => void;
};

export function FillInListingCard({
  shift,
  layout = 'tile',
  onPress,
}: FillInListingCardProps) {
  const logoUri = useClinicLogoUri(shift.clinic.logo_storage_path);
  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');
  const roleTitle = formatShiftPostRoleTitle(shift.role_type);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: spacing.sm,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
    },
    listCompensation: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  if (layout === 'list') {
    return (
      <BrowseListRow
        avatar={
          <ClinicLogoAvatar clinicName={shift.clinic.clinic_name} logoUri={logoUri} size={40} />
        }
        eyebrow={shift.clinic.clinic_name}
        title={roleTitle}
        meta={location || null}
        detail={formatShiftPostMeta(shift)}
        topTrailing={<ShiftUrgencyBadge urgency={shift.urgency} />}
        footer={
          shift.compensation ? (
            <Text style={styles.listCompensation}>{shift.compensation}</Text>
          ) : undefined
        }
        onPress={onPress}
      />
    );
  }

  return (
    <SurfaceCard onPress={onPress}>
      <ClinicPostHeader
        layout="split"
        clinicName={shift.clinic.clinic_name}
        logoStoragePath={shift.clinic.logo_storage_path}
        title={roleTitle}
        location={location || null}
        detail={formatShiftPostMeta(shift)}
        avatarSize={44}
        accessory={<ShiftUrgencyBadge urgency={shift.urgency} />}
        footer={
          shift.compensation ? (
            <View style={styles.footer}>
              <Text style={styles.compensation}>{shift.compensation}</Text>
            </View>
          ) : null
        }
      />
    </SurfaceCard>
  );
}
