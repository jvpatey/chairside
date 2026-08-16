import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChairsideWordmark } from '@/components/brand/ChairsideWordmark';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { CONTENT_MAX_WIDTH } from '@/lib/breakpoints';
import { navigateToPricing, navigateToWelcome, navigateToWelcomeSection } from '@/lib/publicRoutes';
import {
  webHover,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { useTheme, useThemedStyles } from '@/theme';
import { webGlassSurface, webTransition } from '@/theme/web';

type WebMarketingNavProps = {
  scrollY: Animated.Value;
};

const WELCOME_NAV_ITEMS = [
  { id: 'how-it-works', label: 'How it works', kind: 'section' as const },
  { id: 'features', label: 'Features', kind: 'section' as const },
  { id: 'pricing', label: 'Pricing', kind: 'route' as const },
];

function isPricingPath(pathname: string) {
  return pathname === '/pricing' || pathname.endsWith('/pricing');
}

export function WebMarketingNav({ scrollY }: WebMarketingNavProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const { isDark, colors } = useTheme();
  const { width } = useResponsiveLayout();
  const isNarrow = width < 480;
  const showAnchors = width >= 768;
  const [scrolled, setScrolled] = useState(false);
  const onPricing = isPricingPath(pathname);
  // Same scroll-glass behavior as welcome — no forced condensed state on pricing.
  const condensed = scrolled;

  useEffect(() => {
    const id = scrollY.addListener(({ value }) => {
      setScrolled(value > 48);
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
      gap: spacing.md,
    },
    leftCluster: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.lg,
      flex: 1,
      minWidth: 0,
    },
    back: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingVertical: 8,
      paddingHorizontal: 4,
      ...webPointer(),
    },
    backText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    anchors: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      flexShrink: 1,
    },
    anchor: {
      paddingVertical: 8,
      paddingHorizontal: 4,
      ...webPointer(),
    },
    anchorText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: colors.labelSecondary,
    },
    actions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      flexShrink: 0,
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
    },
  }));

  return (
    <View style={styles.outer}>
      <View style={styles.inner}>
        <View style={styles.leftCluster}>
          {onPricing ? (
            <Pressable
              accessibilityRole="link"
              accessibilityLabel="Back to welcome"
              onPress={navigateToWelcome}
              style={({ pressed }) => [styles.back, pressed && { opacity: 0.75 }]}
            >
              {({ hovered }) => (
                <>
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={hovered ? colors.labelPrimary : colors.labelSecondary}
                  />
                  <Text
                    style={[
                      styles.backText,
                      hovered && { color: colors.labelPrimary },
                    ]}
                  >
                    Back
                  </Text>
                </>
              )}
            </Pressable>
          ) : null}
          <ChairsideWordmark variant="small" onPress={navigateToWelcome} />
          {!onPricing && showAnchors ? (
            <View style={styles.anchors}>
              {WELCOME_NAV_ITEMS.map((item) => (
                <Pressable
                  key={item.id}
                  accessibilityRole="link"
                  onPress={() => {
                    if (item.kind === 'route') {
                      navigateToPricing();
                      return;
                    }
                    navigateToWelcomeSection(item.id);
                  }}
                  style={({ pressed }) => [styles.anchor, pressed && { opacity: 0.75 }]}
                >
                  {({ hovered }) => (
                    <Text
                      style={
                        hovered
                          ? [styles.anchorText, { color: colors.labelPrimary }]
                          : styles.anchorText
                      }
                    >
                      {item.label}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
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
