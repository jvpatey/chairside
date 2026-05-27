import type { LiveShiftPost } from '@chairside/api';
import { getUrgencyLabel } from '@chairside/config';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

type FillInListingCardProps = {
  shift: LiveShiftPost;
  onPress?: () => void;
};

export function FillInListingCard({ shift, onPress }: FillInListingCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardPressed: { opacity: 0.92 },
    clinic: {
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.primary,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 22,
    },
    meta: { fontSize: 14, lineHeight: 20, color: colors.labelSecondary },
    footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    compensation: { fontSize: 15, fontWeight: '600', color: colors.primary },
  }));

  const location = [shift.clinic.city, shift.clinic.province].filter(Boolean).join(', ');

  const content = (
    <>
      <Text style={styles.clinic} numberOfLines={1}>
        {shift.clinic.clinic_name}
      </Text>
      <Text style={styles.title}>{formatShiftPostRoleTitle(shift.role_type)}</Text>
      <Text style={styles.meta}>{formatShiftPostMeta(shift)}</Text>
      {location ? <Text style={styles.meta}>{location}</Text> : null}
      {shift.urgency !== 'normal' ? (
        <Text style={styles.meta}>{getUrgencyLabel(shift.urgency)}</Text>
      ) : null}
      <View style={styles.footer}>
        {shift.compensation ? (
          <Text style={styles.compensation}>{shift.compensation}</Text>
        ) : (
          <View />
        )}
      </View>
    </>
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
