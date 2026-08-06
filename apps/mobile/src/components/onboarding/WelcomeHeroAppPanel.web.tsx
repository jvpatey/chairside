import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { APP_STORE_URL } from '@/constants';
import { useCountUp } from '@/hooks/useCountUp';
import { useEnterAnimation } from '@/lib/webMotion.web';
import {
  webHover,
  webOnlyStyle,
  webPointer,
  webTextLinkHoverStyles,
} from '@/lib/webPressableStyles';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';
import { getWebShadow } from '@/theme/web';

const PANEL_ASPECT_RATIO = 1556 / 890;

const SIDEBAR_ITEMS = [
  'grid-outline',
  'briefcase-outline',
  'calendar-outline',
  'chatbubbles-outline',
  'person-outline',
] as const;

const STAT_CARDS = [
  { label: 'Open roles', value: 4, accent: 'primary' as const },
  { label: 'Fill-ins this week', value: 3, accent: 'secondary' as const },
  { label: 'New applications', value: 12, accent: 'success' as const },
] as const;

const ROLE_CARDS = [
  {
    id: 'hygienist',
    title: 'Dental Hygienist',
    meta: 'Permanent · Downtown Halifax',
    applicants: 6,
    status: 'active' as const,
  },
  {
    id: 'assistant',
    title: 'Dental Assistant',
    meta: 'Fill-in · Wed 9:00 AM',
    applicants: 2,
    status: 'open' as const,
  },
  {
    id: 'reception',
    title: 'Receptionist',
    meta: 'Permanent · Bedford',
    applicants: 4,
    status: 'active' as const,
    pulseNew: true,
  },
] as const;

type WelcomeHeroAppPanelProps = {
  enterDelayMs?: number;
};

function HeroStatValue({ value, animate }: { value: number; animate: boolean }) {
  const displayValue = useCountUp(value, { durationMs: 720, delayMs: 280, enabled: animate });
  const { colors } = useTheme();

  const styles = useThemedStyles(() => ({
    value: {
      fontSize: 22,
      lineHeight: 26,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      letterSpacing: -0.3,
    },
  }));

  return <Text style={styles.value}>{displayValue}</Text>;
}

function NewApplicationPulse({ visible }: { visible: boolean }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      opacity.setValue(1);
      scale.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(opacity, { toValue: 1, duration: 420, useNativeDriver: true }),
          Animated.spring(scale, { toValue: 1, tension: 280, friction: 18, useNativeDriver: true }),
        ]),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0.55, duration: 380, useNativeDriver: true }),
        Animated.delay(800),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [opacity, scale, visible]);

  const { colors } = useTheme();
  const styles = useThemedStyles(({ spacing }) => ({
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colorWithAlpha(colors.success, 0.16),
      borderWidth: 1,
      borderColor: colorWithAlpha(colors.success, 0.35),
    },
    text: {
      fontSize: 10,
      fontWeight: '700' as const,
      letterSpacing: 0.3,
      textTransform: 'uppercase' as const,
      color: colors.success,
    },
  }));

  return (
    <Animated.View style={[styles.badge, { opacity, transform: [{ scale }] }]}>
      <Text style={styles.text}>New application</Text>
    </Animated.View>
  );
}

export function WelcomeHeroAppPanel(_props: WelcomeHeroAppPanelProps = {}) {
  const { colors } = useTheme();
  const { opacity: panelOpacity, translateY, ref } = useEnterAnimation(180, { trigger: 'visible' });
  const [statsAnimate, setStatsAnimate] = useState(false);

  useEffect(() => {
    const id = panelOpacity.addListener(({ value }) => {
      if (value > 0.35) setStatsAnimate(true);
    });
    return () => panelOpacity.removeListener(id);
  }, [panelOpacity]);

  const styles = useThemedStyles(({ colors, spacing, radii, isDark: dark }) => ({
    wrap: {
      position: 'relative' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      width: '100%',
      alignSelf: 'stretch' as const,
    },
    glow: {
      display: 'none' as const,
    },
    windowShell: {
      width: '100%',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      backgroundColor: colors.surface,
      overflow: 'hidden' as const,
      ...webOnlyStyle({
        boxShadow: dark
          ? '0 24px 48px rgba(0, 0, 0, 0.35)'
          : '0 20px 40px rgba(26, 111, 212, 0.12)',
      } as object),
    },
    windowChrome: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
      backgroundColor: colors.backgroundGrouped,
    },
    windowDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.fillSubtle,
    },
    dashboardFrame: {
      width: '100%',
      aspectRatio: PANEL_ASPECT_RATIO,
      backgroundColor: colors.backgroundGrouped,
      flexDirection: 'row' as const,
    },
    sidebar: {
      width: 52,
      borderRightWidth: 1,
      borderRightColor: colors.separator,
      backgroundColor: colors.surface,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.sm,
      alignItems: 'center' as const,
    },
    sidebarItem: {
      width: 34,
      height: 34,
      borderRadius: radii.md,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.fillSubtle,
    },
    sidebarItemActive: {
      backgroundColor: colorWithAlpha(colors.primary, dark ? 0.22 : 0.12),
    },
    main: {
      flex: 1,
      padding: spacing.md,
      gap: spacing.md,
      minWidth: 0,
    },
    statsRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      minWidth: 0,
      borderRadius: radii.md,
      padding: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: 2,
      ...webOnlyStyle({ boxShadow: getWebShadow(dark, 'subtle') } as object),
    },
    statLabel: {
      fontSize: 10,
      lineHeight: 13,
      fontWeight: '600' as const,
      letterSpacing: 0.2,
      color: colors.labelTertiary,
      textTransform: 'uppercase' as const,
    },
    rolesList: {
      flex: 1,
      gap: spacing.sm,
    },
    roleCard: {
      borderRadius: radii.md,
      padding: spacing.sm + 2,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      gap: spacing.xs,
      ...webOnlyStyle({ boxShadow: getWebShadow(dark, 'subtle') } as object),
    },
    roleHeader: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    roleTitle: {
      fontSize: 13,
      lineHeight: 17,
      fontWeight: '700' as const,
      color: colors.labelPrimary,
      flex: 1,
    },
    roleMeta: {
      fontSize: 11,
      lineHeight: 15,
      color: colors.labelSecondary,
    },
    roleFooter: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    applicantPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: 999,
      backgroundColor: colors.fillSubtle,
    },
    applicantText: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    appPitch: {
      marginTop: spacing.md,
      alignItems: 'center' as const,
      gap: spacing.xs,
      width: '100%',
    },
    appStoreLink: {
      marginTop: spacing.xs,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: 8,
      ...webPointer(),
    },
    appStoreLinkHovered: webTextLinkHoverStyles(colors),
    appStoreLinkText: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.primary,
    },
  }));

  const statAccent = (accent: (typeof STAT_CARDS)[number]['accent']) => {
    if (accent === 'secondary') return colors.secondary;
    if (accent === 'success') return colors.success;
    return colors.primary;
  };

  const appStoreUrl = APP_STORE_URL;

  return (
    <Animated.View
      ref={ref}
      style={[styles.wrap, { opacity: panelOpacity, transform: [{ translateY }] }]}
    >
      <View style={styles.glow} accessibilityElementsHidden importantForAccessibility="no-hide-descendants" />
      <View style={styles.windowShell}>
        <View style={styles.windowChrome} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View style={styles.windowDot} />
          <View style={styles.windowDot} />
          <View style={styles.windowDot} />
        </View>
        <View
          style={styles.dashboardFrame}
          accessibilityRole="image"
          accessibilityLabel="Chairside dashboard preview with open roles, fill-ins, and applications"
        >
          <View style={styles.sidebar}>
            {SIDEBAR_ITEMS.map((icon, index) => (
              <View
                key={icon}
                style={[styles.sidebarItem, index === 0 && styles.sidebarItemActive]}
              >
                <Ionicons
                  name={icon}
                  size={16}
                  color={index === 0 ? colors.primary : colors.labelTertiary}
                />
              </View>
            ))}
          </View>

          <View style={styles.main}>
            <View style={styles.statsRow}>
              {STAT_CARDS.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                  <HeroStatValue value={stat.value} animate={statsAnimate} />
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: statAccent(stat.accent), alignSelf: 'flex-start' },
                    ]}
                  />
                </View>
              ))}
            </View>

            <View style={styles.rolesList}>
              {ROLE_CARDS.map((role) => (
                <View key={role.id} style={styles.roleCard}>
                  <View style={styles.roleHeader}>
                    <Text style={styles.roleTitle}>{role.title}</Text>
                    {'pulseNew' in role && role.pulseNew ? (
                      <NewApplicationPulse visible={statsAnimate} />
                    ) : null}
                  </View>
                  <Text style={styles.roleMeta}>{role.meta}</Text>
                  <View style={styles.roleFooter}>
                    <View style={styles.applicantPill}>
                      <Ionicons name="people-outline" size={12} color={colors.labelSecondary} />
                      <Text style={styles.applicantText}>{role.applicants} applicants</Text>
                    </View>
                    <View
                      style={[
                        styles.statusDot,
                        {
                          backgroundColor:
                            role.status === 'open' ? colors.primary : colors.success,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
      {appStoreUrl ? (
        <View style={styles.appPitch}>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Download on the App Store"
            onPress={() => void Linking.openURL(appStoreUrl)}
            style={({ pressed, hovered }) => [
              styles.appStoreLink,
              webHover(hovered, pressed, styles.appStoreLinkHovered),
              pressed && { opacity: 0.75 },
            ]}
          >
            <Text style={styles.appStoreLinkText}>Download for iPhone</Text>
          </Pressable>
        </View>
      ) : null}
    </Animated.View>
  );
}
