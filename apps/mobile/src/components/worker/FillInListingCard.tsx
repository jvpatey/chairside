import type { LiveShiftPost } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { BrowseListRow } from '@/components/ui/BrowseListRow';
import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import type { ListingLayout } from '@/components/ui/BrowseListRow';
import { webHover, webPointer, webTileHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  layout?: ListingLayout;
  isLast?: boolean;
  onPress?: () => void;
};

export function FillInListingCard({
  shift,
  layout = 'tile',
  isLast,
  onPress,
}: FillInListingCardProps) {
  const logoUri = useClinicLogoUri(shift.clinic.logo_storage_path);
  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');
  const roleTitle = formatShiftPostRoleTitle(shift.role_type);

  const styles = useThemedStyles(({ colors, spacing, isDark }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      ...webPointer(),
    },
    cardHovered: webTileHoverStyles(colors, isDark),
    cardPressed: { opacity: 0.92 },
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
        isLast={isLast}
        onPress={onPress}
      />
    );
  }

  const content = (
    <ClinicPostHeader
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
  );

  if (!onPress) return <View style={styles.card}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed, hovered }) => [
        styles.card,
        webHover(hovered, pressed, styles.cardHovered),
        pressed && styles.cardPressed,
      ]}>
      {content}
    </Pressable>
  );
}
