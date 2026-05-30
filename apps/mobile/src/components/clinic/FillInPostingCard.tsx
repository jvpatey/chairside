import type { ShiftPost } from '@chairside/api';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { ShiftPostStatusBadge } from '@/components/clinic/ShiftPostStatusBadge';
import { formatShiftPostMeta, formatShiftPostRoleTitle } from '@/lib/shiftPostDisplay';
import { useThemedStyles } from '@/theme';

type FillInPostingCardProps = {
  shift: ShiftPost;
  pendingRequestCount?: number;
  onPress?: () => void;
};

export function FillInPostingCard({
  shift,
  pendingRequestCount = 0,
  onPress,
}: FillInPostingCardProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.sm,
    },
    cardPressed: {
      opacity: 0.92,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    headerMain: {
      flex: 1,
      gap: 4,
    },
    title: {
      ...typography.body,
      fontWeight: '600',
      fontSize: 16,
      lineHeight: 22,
      letterSpacing: -0.2,
    },
    meta: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    compensation: {
      fontSize: 15,
      fontWeight: '600',
      color: colors.primary,
      letterSpacing: -0.1,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    requestsPill: {
      backgroundColor: colors.primarySubtle,
      borderRadius: 999,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    requestsText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const content = (
    <>
      <View style={styles.header}>
        <View style={styles.headerMain}>
          <Text style={styles.title} numberOfLines={2}>
            {formatShiftPostRoleTitle(shift.role_type)}
          </Text>
          <Text style={styles.meta}>{formatShiftPostMeta(shift)}</Text>
        </View>
        <ShiftPostStatusBadge status={shift.status} />
      </View>
      {shift.compensation || pendingRequestCount > 0 ? (
        <View style={styles.footer}>
          {shift.compensation ? (
            <Text style={styles.compensation}>{shift.compensation}</Text>
          ) : (
            <View />
          )}
          {pendingRequestCount > 0 ? (
            <View style={styles.requestsPill}>
              <Text style={styles.requestsText}>
                {pendingRequestCount === 1
                  ? '1 request'
                  : `${pendingRequestCount} requests`}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.card}>{content}</View>;
  }

  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
    >
      {content}
    </Pressable>
  );
}
