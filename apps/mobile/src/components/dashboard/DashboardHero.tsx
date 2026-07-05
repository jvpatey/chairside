import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { router, useFocusEffect, type Href } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useCallback } from 'react';

import { DashboardHeroActions } from '@/components/dashboard/DashboardHeroActions';
import {
  DashboardHeroName,
  DashboardHeroSubtitle,
} from '@/components/dashboard/DashboardHeroIdentity';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { IS_WEB } from '@/lib/webPressableStyles';
import {
  colorWithAlpha,
  fontRegular,
  fontSemibold,
  getHeroBandGradient,
  useTheme,
  useThemedStyles,
} from '@/theme';

type DashboardHeroProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  namePlaceholder: string;
  subtitle: string;
  contextLine?: string;
  showActions?: boolean;
};

function formatDashboardDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

/** Premium greeting band with animated atmosphere wash. */
export function DashboardHero({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  namePlaceholder,
  subtitle,
  contextLine,
  showActions = true,
}: DashboardHeroProps) {
  const { colors, isDark } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const reducedMotion = useReducedMotion();
  const overlayActions = !isTablet && showActions;
  const heroOpensProfile = Platform.OS !== 'web';
  const drift = useSharedValue(0);

  const startOrbMotion = useCallback(() => {
    if (reducedMotion) {
      drift.value = 0;
      return;
    }
    drift.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [drift, reducedMotion]);

  useFocusEffect(
    useCallback(() => {
      startOrbMotion();
      return () => {
        cancelAnimation(drift);
        drift.value = 0;
      };
    }, [drift, startOrbMotion]),
  );

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -24 + drift.value * 48 },
      { translateY: -8 + drift.value * 16 },
      { scale: 1 + drift.value * 0.08 },
    ],
    opacity: 0.55 + drift.value * 0.2,
  }));

  const styles = useThemedStyles(({ colors, spacing, radii, elevation, isDark }) => ({
    band: {
      borderRadius: radii.hero,
      overflow: 'hidden',
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.22 : 0.12),
      position: 'relative' as const,
      ...elevation('subtle'),
      ...(overlayActions
        ? null
        : {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg + 4,
          }),
    },
    bandContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg + 4,
      paddingTop: spacing.lg + 4,
    },
    gradient: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    orb: {
      position: 'absolute',
      top: -36,
      right: -12,
      width: 140,
      height: 140,
      borderRadius: 70,
      backgroundColor: colorWithAlpha(colors.secondary, isDark ? 0.22 : 0.18),
    },
    row: {
      position: 'relative' as const,
      ...(overlayActions
        ? null
        : {
            flexDirection: 'row' as const,
            alignItems: 'flex-start' as const,
            gap: spacing.md,
          }),
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    identityPressed: {
      opacity: 0.85,
    },
    actionsCorner: {
      position: 'absolute' as const,
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 2,
    },
    greeting: {
      fontSize: IS_WEB && isTablet ? 16 : 15,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    contextRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radii.pill,
      backgroundColor: colorWithAlpha(colors.surface, isDark ? 0.16 : 0.72),
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colorWithAlpha(colors.primaryOnPrimary, isDark ? 0.18 : 0.35),
    },
    chipLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: isDark ? colors.labelPrimary : colors.labelPrimary,
    },
  }));

  const gradientColors = getHeroBandGradient(colors, isDark);

  const openProfile = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(profileHref);
  };

  const identityBody = (
    <>
      <Text style={styles.greeting} accessibilityRole="text">
        {getTimeOfDayGreeting()}
      </Text>
      <DashboardHeroName displayName={displayName} namePlaceholder={namePlaceholder} />
      <DashboardHeroSubtitle
        subtitle={subtitle}
        trailing={contextLine ? undefined : formatDashboardDate()}
      />
      {contextLine ? (
        <View style={styles.contextRow}>
          <View style={styles.chip}>
            <Text style={styles.chipLabel}>{contextLine}</Text>
          </View>
        </View>
      ) : null}
    </>
  );

  const identity = heroOpensProfile ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open profile"
      onPress={openProfile}
      style={({ pressed }) => [styles.identity, pressed && styles.identityPressed]}>
      {identityBody}
    </Pressable>
  ) : (
    <View style={styles.identity}>{identityBody}</View>
  );

  return (
    <View style={styles.band}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      <Animated.View style={[styles.orb, orbStyle]} pointerEvents="none" />
      {overlayActions && showActions ? (
        <View style={styles.actionsCorner}>
          <DashboardHeroActions
            profileHref={profileHref}
            avatarKind={avatarKind}
            displayName={displayName}
            photoUri={photoUri}
            compact
          />
        </View>
      ) : null}
      <View style={overlayActions ? styles.bandContent : undefined}>
        <View style={styles.row}>
          {overlayActions ? (
            identity
          ) : (
            <>
              {identity}
              {showActions ? (
                <DashboardHeroActions
                  profileHref={profileHref}
                  avatarKind={avatarKind}
                  displayName={displayName}
                  photoUri={photoUri}
                />
              ) : null}
            </>
          )}
        </View>
      </View>
    </View>
  );
}
