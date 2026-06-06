import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type NotificationCountBadgeProps = {
  count: number;
};

/** Matches tab bar notification badge styling. */
export function NotificationCountBadge({ count }: NotificationCountBadgeProps) {
  const styles = useThemedStyles(({ colors }) => ({
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.destructive,
    },
    text: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primaryOnPrimary,
      lineHeight: 13,
    },
  }));

  if (count <= 0) return null;

  return (
    <View style={styles.badge} accessibilityLabel={`${count} notifications`}>
      <Text style={styles.text}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}
