import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type AccountTypeBadgeProps = {
  label: string;
};

export function AccountTypeBadge({ label }: AccountTypeBadgeProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    badge: {
      marginTop: spacing.xs,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.fillSubtle,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label} account</Text>
    </View>
  );
}
