import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { webHover, webPointer, webTextLinkHoverStyles } from '@/lib/webPressableStyles';
import { useThemedStyles } from '@/theme';

function handleBack() {
  if (router.canGoBack?.()) {
    router.back();
    return;
  }
  router.push('/(onboarding)/welcome');
}

export function PublicLegalPageHeader() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    headerRow: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      marginBottom: spacing.xl,
      minHeight: 44,
    },
    backPressable: {
      position: 'absolute' as const,
      left: 0,
      top: 0,
      bottom: 0,
      justifyContent: 'center' as const,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    backHovered: webTextLinkHoverStyles(colors),
    backText: {
      ...typography.body,
      fontSize: 14,
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
      <ChairsideWordmark variant="small" align="center" />
    </View>
  );
}
