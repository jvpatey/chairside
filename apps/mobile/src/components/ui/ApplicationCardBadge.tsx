import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type ApplicationCardBadgeProps = {
  label?: string;
};

export function ApplicationCardBadge({ label }: ApplicationCardBadgeProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    label: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.row} accessibilityLabel={label ?? 'Unread application update'}>
      <View style={styles.dot} accessibilityElementsHidden />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}
