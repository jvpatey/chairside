import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { formatShiftPostMeta } from '@/lib/shiftPostDisplay';
import { useTheme, useThemedStyles } from '@/theme';

type ConfirmedFillInCardProps = {
  workerName: string;
  postTitle: string;
  shiftDate: string;
  startTime: string | null;
  endTime: string | null;
  compact?: boolean;
  onPress?: () => void;
};

export function ConfirmedFillInCard({
  workerName,
  postTitle,
  shiftDate,
  startTime,
  endTime,
  compact = false,
  onPress,
}: ConfirmedFillInCardProps) {
  const { colors } = useTheme();
  const meta = formatShiftPostMeta({
    shift_date: shiftDate,
    start_time: startTime ?? '',
    end_time: endTime ?? '',
  });

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: compact ? 12 : 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: compact ? spacing.md : spacing.lg,
    },
    rowPressed: {
      opacity: 0.92,
    },
    iconWrap: {
      width: compact ? 36 : 40,
      height: compact ? 36 : 40,
      borderRadius: compact ? 18 : 20,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1, gap: 2 },
    title: {
      ...typography.body,
      fontWeight: '600',
      fontSize: compact ? 15 : typography.body.fontSize,
    },
    meta: {
      ...typography.subtitle,
      fontSize: compact ? 13 : typography.subtitle.fontSize,
    },
    chevron: {
      marginLeft: spacing.xs,
    },
  }));

  const content = (
    <>
      <View style={styles.iconWrap}>
        <Ionicons name="checkmark-circle" size={compact ? 20 : 22} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <Text style={styles.title}>{workerName} confirmed</Text>
        <Text style={styles.meta}>
          {postTitle} · {meta}
        </Text>
      </View>
      {onPress ? (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.labelTertiary}
          style={styles.chevron}
        />
      ) : null}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${workerName} confirmed for ${postTitle}`}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      {content}
    </Pressable>
  );
}
