import { LinearGradient } from 'expo-linear-gradient';
import { type Href } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

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
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    return () => {
      cancelAnimation(drift);
    };
  }, [drift]);

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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg + 4,
      borderWidth: Platform.OS === 'web' ? 1 : 0,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.22 : 0.12),
      ...elevation('subtle'),
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
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
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
      marginTop: spacing.xs,
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

  return (
    <View style={styles.band}>
      <LinearGradient colors={gradientColors} style={styles.gradient} />
      <Animated.View style={[styles.orb, orbStyle]} pointerEvents="none" />
      <View style={styles.row}>
        <View style={styles.identity}>
          <Text style={styles.greeting} accessibilityRole="text">
            {getTimeOfDayGreeting()}
          </Text>
          <DashboardHeroName
            displayName={displayName}
            namePlaceholder={namePlaceholder}
          />
          <DashboardHeroSubtitle subtitle={subtitle} />
          <View style={styles.contextRow}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>{contextLine ?? formatDashboardDate()}</Text>
            </View>
          </View>
        </View>
        {showActions ? (
          <DashboardHeroActions
            profileHref={profileHref}
            avatarKind={avatarKind}
            displayName={displayName}
            photoUri={photoUri}
          />
        ) : null}
      </View>
    </View>
  );
}
