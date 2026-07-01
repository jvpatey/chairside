import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { navigateToWelcome } from '@/lib/publicRoutes';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

function handleBack() {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  navigateToWelcome();
}

export function PublicLegalPageHeader() {
  const { isCompact } = useResponsiveLayout();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    headerRow: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: isCompact ? spacing.lg : spacing.xl,
      minHeight: 44,
    },
    backPressable: {
      position: 'absolute' as const,
      left: isCompact ? -spacing.xs : 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center' as const,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
      minHeight: 44,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      ...typography.body,
      fontSize: isCompact ? 16 : 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  return (
    <View style={styles.headerRow}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        onPress={handleBack}
        style={({ pressed, hovered }) => [
          styles.backPressable,
          webHover(hovered, pressed, styles.backHovered),
          pressed && { opacity: 0.75 },
        ]}>
        <Text style={styles.backText}>Back</Text>
      </Pressable>
      <ChairsideWordmark variant="small" align="center" onPress={navigateToWelcome} />
    </View>
  );
}
