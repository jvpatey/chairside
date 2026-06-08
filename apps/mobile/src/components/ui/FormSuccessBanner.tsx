import { Text, View } from 'react-native';

import { useThemedStyles } from '@/theme';

type FormSuccessBannerProps = {
  message: string | null;
};

export function FormSuccessBanner({ message }: FormSuccessBannerProps) {
  const styles = useThemedStyles(({ colors, spacing }) => ({
    banner: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.success,
      backgroundColor: `${colors.success}14`,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
  }));

  if (!message) return null;

  return (
    <View accessibilityRole="alert">
      <Text style={styles.banner}>{message}</Text>
    </View>
  );
}
