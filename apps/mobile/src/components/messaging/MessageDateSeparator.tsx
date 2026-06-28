import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type MessageDateSeparatorProps = {
  label: string;
};

export function MessageDateSeparator({ label }: MessageDateSeparatorProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    row: {
      alignItems: 'center',
      paddingVertical: spacing.sm,
    },
    pill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: 999,
      backgroundColor: colors.backgroundGrouped,
    },
    label: {
      ...typography.subtitle,
      fontSize: 12,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.row} accessibilityRole="text">
      <View style={styles.pill}>
        <Text style={styles.label}>{label}</Text>
      </View>
    </View>
  );
}
