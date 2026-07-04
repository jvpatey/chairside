import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { navigateToWelcome } from '@/lib/publicRoutes';
import {
  webHover,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webGlassSurface, webTransition } from '@/theme/web';

type WebMarketingNavProps = {
  scrollY: Animated.Value;
};

export function WebMarketingNav({ scrollY }: WebMarketingNavProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { width } = useResponsiveLayout();
  // Below this width the wordmark + both CTAs no longer fit on one row.
  const isNarrow = width < 480;
  const [condensed, setCondensed] = useState(false);

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      setCondensed(value > 48);
    });
    return () => scrollY.removeListener(id);
  }, [scrollY]);

  const styles = useThemedStyles(({ colors, spacing }) => ({
    outer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      zIndex: 100,
      paddingTop: insets.top + (condensed ? 8 : 12),
      paddingBottom: condensed ? 8 : 12,
      paddingHorizontal: isNarrow ? spacing.md : spacing.lg,
      ...webTransition(['padding', 'background-color', 'box-shadow', 'backdrop-filter']),
      ...(condensed ? webGlassSurface(colors, isDark) : {}),
    },
    inner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      maxWidth: CONTENT_MAX_WIDTH.xwide,
      width: '100%' as const,
      alignSelf: 'center' as const,
    },
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    signIn: {
      paddingVertical: 14,
      paddingHorizontal: spacing.lg,
      borderRadius: 10,
      ...webPointer(),
    },
    signInHovered: webTextLinkHoverStyles(colors),
    signInText: {
      fontSize: 15,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    getStarted: {
      alignSelf: 'auto' as const,
      flexShrink: 0,
      paddingVertical: 14,
      paddingHorizontal: isNarrow ? spacing.md : spacing.lg,
      minHeight: 48,
    },
  }));

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <ChairsideWordmark variant="small" onPress={navigateToWelcome} />
        <View style={styles.actions}>
          {!isNarrow ? (
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push('/(onboarding)/sign-in')}
              style={({ pressed, hovered }) => [
                styles.signIn,
                webHover(hovered, pressed, styles.signInHovered),
                pressed && { opacity: 0.8 },
              ]}
            >
              <Text style={styles.signInText}>Sign in</Text>
            </Pressable>
          ) : null}
          <OnboardingButton
            label="Get started"
            onPress={() => router.push('/(onboarding)/role')}
            variant="primary"
            style={styles.getStarted}
          />
        </View>
      </View>
    </View>
  );
}
