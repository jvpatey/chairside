import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, View } from 'react-native';

import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';
import { webPointer } from '@/lib/webPressableStyles';

type DashboardErrorBannerProps = {
  message?: string;
  onRetry: () => void;
};

/** Inline retry banner when dashboard data fails to load. */
export function DashboardErrorBanner({
  message = 'Could not refresh your dashboard.',
  onRetry,
}: DashboardErrorBannerProps) {
  const { colors } = useTheme();

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primarySubtle,
      borderRadius: radii.lg,
      borderWidth: 1,
      borderColor: `${colors.primary}44`,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    text: {
      flex: 1,
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelPrimary,
    },
    retryPressable: {
      borderRadius: 8,
      paddingHorizontal: 4,
      paddingVertical: 2,
      ...webPointer(),
    },
    retry: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.primary,
    },
  }));

  const handleRetry = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRetry();
  };

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Ionicons name="cloud-offline-outline" size={20} color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retry"
        onPress={handleRetry}
        style={styles.retryPressable}>
        <Text style={styles.retry}>Retry</Text>
      </Pressable>
    </View>
  );
}
