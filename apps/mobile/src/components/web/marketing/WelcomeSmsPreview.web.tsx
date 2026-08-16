import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

const SMS_BODY = 'Same-day hygienist fill-in opened near you. Today 9–5.';

/** Incoming-text look for marketing snapshots — not an in-app notification card. */
export function WelcomeSmsPreview() {
  const styles = useThemedStyles(({ colors, isDark }) => ({
    wrap: {
      gap: 4,
      alignItems: 'flex-start' as const,
    },
    sender: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
      paddingLeft: 10,
    },
    bubble: {
      maxWidth: '100%' as const,
      backgroundColor: isDark ? '#2C2C2E' : '#E9E9EB',
      borderRadius: 18,
      borderBottomLeftRadius: 5,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    body: {
      fontSize: 13,
      lineHeight: 18,
      color: isDark ? '#FFFFFF' : '#111111',
    },
    time: {
      fontSize: 10,
      fontWeight: '500' as const,
      color: colors.labelTertiary,
      paddingLeft: 10,
      marginTop: 2,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.sender}>Chairside</Text>
      <View style={styles.bubble}>
        <Text style={styles.body}>{SMS_BODY}</Text>
      </View>
      <Text style={styles.time}>Text Message</Text>
    </View>
  );
}
