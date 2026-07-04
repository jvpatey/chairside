import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { Platform, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  SensorType,
  useAnimatedSensor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
  type AnimatedStyle,
} from 'react-native-reanimated';

import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import {
  WELCOME_STAGGER,
  enterSpringUp,
} from '@/components/onboarding/onboardingAnimations';
import { colorWithAlpha, fontSemibold, useTheme, useThemedStyles } from '@/theme';

const IS_NATIVE_MOBILE = Platform.OS === 'ios' || Platform.OS === 'android';

type FloatingCardProps = {
  children: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  bobDurationMs: number;
  parallaxMultiplier: number;
  reducedMotion: boolean | null;
  rotationDeg: number;
};

function FloatingCard({
  children,
  containerStyle,
  bobDurationMs,
  parallaxMultiplier,
  reducedMotion,
  rotationDeg,
}: FloatingCardProps) {
  const bob = useSharedValue(0);
  const gravity = useAnimatedSensor(SensorType.GRAVITY, {
    interval: 'auto',
    adjustToInterfaceOrientation: true,
  });

  useEffect(() => {
    if (reducedMotion) return;

    bob.value = withRepeat(
      withTiming(1, { duration: bobDurationMs, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [bob, bobDurationMs, reducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    const bobOffset = reducedMotion ? 0 : -1.5 + bob.value * 3;
    let parallaxX = 0;
    let parallaxY = 0;

    if (IS_NATIVE_MOBILE && !reducedMotion) {
      parallaxX = -gravity.sensor.value.x * parallaxMultiplier;
      parallaxY = gravity.sensor.value.y * (parallaxMultiplier * 0.6);
    }

    return {
      transform: [
        { translateX: parallaxX },
        { translateY: bobOffset + parallaxY },
        { rotate: `${rotationDeg}deg` },
      ],
    };
  });

  return (
    <Animated.View
      style={[containerStyle, animatedStyle as AnimatedStyle<ViewStyle>]}
      pointerEvents="none">
      {children}
    </Animated.View>
  );
}

function ShiftPreviewCard() {
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      width: 228,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radii.sm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(colors.primary, 0.16),
    },
    title: {
      flex: 1,
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 13,
      lineHeight: 18,
      color: colors.labelSecondary,
    },
    ratePill: {
      alignSelf: 'flex-start' as const,
      borderRadius: radii.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      backgroundColor: colorWithAlpha(colors.primary, 0.14),
    },
    rateText: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      color: colors.primary,
    },
  }));

  return (
    <LiquidGlassSurface borderRadius={18} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="medkit-outline" size={18} color={styles.rateText.color} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          Dental Hygienist
        </Text>
      </View>
      <Text style={styles.meta}>Tomorrow · 8:00–4:00</Text>
      <View style={styles.ratePill}>
        <Text style={styles.rateText}>$42/hr</Text>
      </View>
    </LiquidGlassSurface>
  );
}

function MatchPreviewCard() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing }) => ({
    card: {
      width: 196,
      padding: spacing.md,
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(colors.success, 0.18),
    },
    title: {
      flex: 1,
      fontSize: 14,
      lineHeight: 19,
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.labelSecondary,
      paddingLeft: 36,
    },
  }));

  return (
    <LiquidGlassSurface borderRadius={16} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="checkmark" size={16} color={colors.success} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          You&apos;re booked!
        </Text>
      </View>
      <Text style={styles.meta}>Starts tomorrow · 8:00 AM</Text>
    </LiquidGlassSurface>
  );
}

function SameDayPreviewCard() {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    card: {
      width: 184,
      padding: spacing.md,
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: radii.sm,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colorWithAlpha(colors.secondary, 0.2),
    },
    title: {
      flex: 1,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      color: colors.labelPrimary,
    },
    meta: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.labelSecondary,
      paddingLeft: 36,
    },
  }));

  return (
    <LiquidGlassSurface borderRadius={16} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="flash-outline" size={15} color={colors.secondary} />
        </View>
        <Text style={styles.title} numberOfLines={1}>
          Same-day shift
        </Text>
      </View>
      <Text style={styles.meta}>Today · 2:00–6:00 PM</Text>
    </LiquidGlassSurface>
  );
}

/** Decorative mini app previews that float between hero copy and CTAs. */
export function WelcomeFloatingCards() {
  const reducedMotion = useReducedMotion();
  const styles = useThemedStyles(({ spacing }) => ({
    stage: {
      flex: 1,
      minHeight: 240,
      justifyContent: 'flex-start' as const,
      paddingTop: spacing.xl,
      paddingBottom: spacing.md,
    },
    shiftCard: {
      alignSelf: 'flex-start' as const,
      marginLeft: spacing.sm,
    },
    matchCard: {
      alignSelf: 'flex-end' as const,
      marginTop: spacing.md,
      marginRight: spacing.sm,
    },
    sameDayCard: {
      alignSelf: 'flex-start' as const,
      marginTop: spacing.md,
      marginLeft: spacing.lg,
    },
  }));

  return (
    <Animated.View
      entering={enterSpringUp(WELCOME_STAGGER.cards, reducedMotion)}
      style={styles.stage}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <FloatingCard
        containerStyle={styles.shiftCard}
        bobDurationMs={11000}
        parallaxMultiplier={3}
        reducedMotion={reducedMotion}
        rotationDeg={-1.5}>
        <ShiftPreviewCard />
      </FloatingCard>
      <FloatingCard
        containerStyle={styles.matchCard}
        bobDurationMs={13000}
        parallaxMultiplier={4}
        reducedMotion={reducedMotion}
        rotationDeg={1.5}>
        <MatchPreviewCard />
      </FloatingCard>
      <FloatingCard
        containerStyle={styles.sameDayCard}
        bobDurationMs={15000}
        parallaxMultiplier={2.5}
        reducedMotion={reducedMotion}
        rotationDeg={-1}>
        <SameDayPreviewCard />
      </FloatingCard>
    </Animated.View>
  );
}
