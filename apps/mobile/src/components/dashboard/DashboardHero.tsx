import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { DashboardHeroActions } from '@/components/dashboard/DashboardHeroActions';
import {
  DashboardHeroName,
  DashboardHeroSubtitle,
} from '@/components/dashboard/DashboardHeroIdentity';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { DashboardHeroPulse } from '@/lib/dashboardPulse';
import { getTimeOfDayGreeting, getTimeOfDayIcon } from '@/lib/greeting';
import { useEnterAnimation } from '@/lib/motion';
import {
  IS_WEB,
  webListRowHoverStyles,
  webOnlyStyle,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontRegular, fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DashboardHeroProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  namePlaceholder: string;
  subtitle: string;
  /** Muted identity meta on the subtitle line (e.g. "Owner"). */
  identityLine?: string;
  /** Optional first name for "Good afternoon, Sarah". */
  greetingName?: string | null;
  /** Live one-line summary; tap opens highest-priority destination. */
  pulse?: DashboardHeroPulse | null;
  /** Static context chip (e.g. read-only label). Ignored when `contextSlot` is set. */
  contextLine?: string;
  /** Interactive or custom context under the subtitle (e.g. location scope picker). */
  contextSlot?: ReactNode;
  showActions?: boolean;
  /** Hide avatar in action cluster on web/tablet (sidebar owns identity). */
  hideProfileOnWebTablet?: boolean;
};

function formatDashboardDate(date = new Date()) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function usePrefersReducedMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

function HeroStaggerBlock({
  delayMs,
  reduceMotion,
  children,
}: {
  delayMs: number;
  reduceMotion: boolean;
  children: ReactNode;
}) {
  const { opacity, translateY } = useEnterAnimation(reduceMotion ? 0 : delayMs);

  if (reduceMotion) {
    return <View>{children}</View>;
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>
  );
}

/** Compact dashboard header — flat surface, no gradient wash. */
export function DashboardHero({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  namePlaceholder,
  subtitle,
  identityLine,
  greetingName,
  pulse,
  contextLine,
  contextSlot,
  showActions = true,
  hideProfileOnWebTablet = false,
}: DashboardHeroProps) {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const reduceMotion = usePrefersReducedMotion();
  const overlayActions = !isTablet && showActions;
  const heroOpensProfile = Platform.OS !== 'web';
  const hideProfileInActions = hideProfileOnWebTablet && IS_WEB && isTablet;
  const isWeb = Platform.OS === 'web';
  const timeIcon = getTimeOfDayIcon();

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    band: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      position: 'relative' as const,
      overflow: 'hidden' as const,
      ...(overlayActions
        ? null
        : {
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.lg,
            paddingBottom: pulse ? 0 : spacing.lg,
          }),
    },
    bandContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: pulse ? spacing.md : spacing.lg,
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
      gap: spacing.xs + 2,
    },
    identityStack: {
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
    greetingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    greetingGlyph: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.tertiarySubtle,
      flexShrink: 0,
    },
    greeting: {
      flex: 1,
      minWidth: 0,
      fontSize: IS_WEB && isTablet ? 15 : 14,
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
      backgroundColor: colors.fillSubtle,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
    },
    chipLabel: {
      fontSize: 12,
      lineHeight: 16,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    pulseDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
    },
    pulseRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm + 2,
      ...webPointer(),
      ...webOnlyStyle({
        transitionProperty: 'background-color, opacity',
        transitionDuration: '140ms',
      } as const),
    },
    pulseRowHovered: webListRowHoverStyles(colors),
    pulseRowPressed: {
      opacity: 0.88,
    },
    pulseIconBadge: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
      flexShrink: 0,
    },
    pulseLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    pulseChevron: {
      flexShrink: 0,
      opacity: 0.45,
    },
  }));

  const openProfile = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(profileHref);
  }, [profileHref]);

  const handlePulsePress = useCallback(() => {
    if (!pulse) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulse.onPress();
  }, [pulse]);

  const hasContext = Boolean(contextSlot) || Boolean(contextLine);
  const trimmedIdentity = identityLine?.trim() || null;

  const contextContent = contextSlot ? (
    <View style={styles.contextRow}>{contextSlot}</View>
  ) : contextLine ? (
    <View style={styles.contextRow}>
      <View style={styles.chip}>
        <Text style={styles.chipLabel}>{contextLine}</Text>
      </View>
    </View>
  ) : null;

  const identityCore = (
    <View style={styles.identityStack}>
      <HeroStaggerBlock delayMs={0} reduceMotion={reduceMotion}>
        <View style={styles.greetingRow}>
          <View style={styles.greetingGlyph}>
            <Ionicons name={timeIcon} size={15} color={colors.tertiary} />
          </View>
          <Text style={styles.greeting} accessibilityRole="text" numberOfLines={1}>
            {getTimeOfDayGreeting(greetingName)}
          </Text>
        </View>
      </HeroStaggerBlock>
      <HeroStaggerBlock delayMs={40} reduceMotion={reduceMotion}>
        <DashboardHeroName displayName={displayName} namePlaceholder={namePlaceholder} />
      </HeroStaggerBlock>
      <HeroStaggerBlock delayMs={80} reduceMotion={reduceMotion}>
        <DashboardHeroSubtitle
          subtitle={subtitle}
          detail={trimmedIdentity}
          trailing={hasContext || trimmedIdentity || pulse ? undefined : formatDashboardDate()}
        />
      </HeroStaggerBlock>
    </View>
  );

  const identity = heroOpensProfile ? (
    <View style={styles.identity}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open profile"
        onPress={openProfile}
        style={({ pressed }) => [pressed && styles.identityPressed]}>
        {identityCore}
      </Pressable>
      {contextContent}
    </View>
  ) : (
    <View style={styles.identity}>
      {identityCore}
      {contextContent}
    </View>
  );

  const pulseFooter = pulse ? (
    <HeroStaggerBlock delayMs={120} reduceMotion={reduceMotion}>
      <View>
        <View style={styles.pulseDivider} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={pulse.label}
          onPress={handlePulsePress}
          style={({ pressed, hovered }) => [
            styles.pulseRow,
            isWeb && hovered && !pressed && styles.pulseRowHovered,
            pressed && styles.pulseRowPressed,
          ]}>
          <View style={styles.pulseIconBadge}>
            <Ionicons name={pulse.icon} size={15} color={colors.primary} />
          </View>
          <Text style={styles.pulseLabel} numberOfLines={1}>
            {pulse.label}
          </Text>
          {isWeb ? (
            <Ionicons
              name="chevron-forward"
              size={16}
              color={colors.labelTertiary}
              style={styles.pulseChevron}
            />
          ) : null}
        </Pressable>
      </View>
    </HeroStaggerBlock>
  ) : null;

  return (
    <View style={styles.band}>
      {overlayActions && showActions ? (
        <View style={styles.actionsCorner}>
          <DashboardHeroActions
            profileHref={profileHref}
            avatarKind={avatarKind}
            displayName={displayName}
            photoUri={photoUri}
            compact
            hideProfile={hideProfileInActions}
            hideSignOut={hideProfileInActions}
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
                  hideProfile={hideProfileInActions}
                  hideSignOut={hideProfileInActions}
                />
              ) : null}
            </>
          )}
        </View>
      </View>
      {pulseFooter}
    </View>
  );
}
