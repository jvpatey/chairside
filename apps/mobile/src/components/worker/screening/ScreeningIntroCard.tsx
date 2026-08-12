import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

export function ScreeningIntroCard() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.xs,
    },
    title: {
      ...typography.body,
      fontSize: 16,
      fontWeight: '700',
    },
    body: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
    },
  }));

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>A few quick questions</Text>
      <Text style={styles.body}>
        The clinic requires you to answer these questions. Based on your responses, they may request
        your full application. Some answers may be must-pass for the role.
      </Text>
    </View>
  );
}
