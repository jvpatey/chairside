import type { LiveShiftPost } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ClinicPostHeader } from '@/components/worker/ClinicPostHeader';
import { ShiftUrgencyBadge } from '@/components/worker/ShiftUrgencyBadge';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  onPress?: () => void;
};

export function FillInListingCard({ shift, onPress }: FillInListingCardProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
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
  }));

  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');

  const content = (
    <ClinicPostHeader
      clinicName={shift.clinic.clinic_name}
      logoStoragePath={shift.clinic.logo_storage_path}
      title={formatShiftPostRoleTitle(shift.role_type)}
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
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}>
      {content}
    </Pressable>
  );
}
