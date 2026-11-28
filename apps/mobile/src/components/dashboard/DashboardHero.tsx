import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import type { Href } from 'expo-router';
import { useCallback, type ReactNode } from 'react';
import {
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
import { SoftEdgeDivider } from '@/components/ui/SoftEdgeDivider';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import type { DashboardHeroPulse } from '@/lib/dashboardPulse';
import { useEnterAnimation, usePrefersReducedMotion } from '@/lib/motion';
import {
  IS_WEB,
  webHover,
  webListRowHoverStyles,
  webOnlyStyle,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

type DashboardHeroProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  namePlaceholder: string;
  subtitle: string;
  /** Muted identity meta on the subtitle line (e.g. "Owner"). */
  identityLine?: string;
  /** @deprecated Unused — identity header no longer shows a time-of-day greeting. */
  greetingName?: string | null;
  /** Live one-line summary; tap opens highest-priority destination. */
  pulse?: DashboardHeroPulse | null;
  /** Product status under identity (e.g. "2 confirmed · 1 pending"). */
  statusLine?: string | null;
  onStatusPress?: () => void;
  /** Leading status chip (e.g. text-alerts state badge). */
  statusBadge?: ReactNode;
  /** Static context chip (e.g. read-only label). Ignored when `contextSlot` is set. */
  contextLine?: string;
  /** Interactive or custom context under the subtitle (e.g. location scope picker). */
  contextSlot?: ReactNode;
  showActions?: boolean;
  /** Hide avatar in action cluster on web/tablet (sidebar owns identity). */
  hideProfileOnWebTablet?: boolean;
  /** Render the phone overlay layout even when the window is tablet-sized (marketing preview). */
  forcePhoneLayout?: boolean;
  /**
   * Flush page header — no card chrome. Name + role left, actions right.
   * Preferred for Home when the sidebar is present.
   */
  flush?: boolean;
};

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

/** Home / dashboard header — identity first, optional product status. */
export function DashboardHero({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  namePlaceholder,
  subtitle,
  identityLine,
  greetingName: _greetingName,
  pulse,
  statusLine,
  onStatusPress,
  statusBadge,
  contextLine,
  contextSlot,
  showActions = true,
  hideProfileOnWebTablet = false,
  forcePhoneLayout = false,
  flush = false,
}: DashboardHeroProps) {
  const { colors } = useTheme();
  const { isTablet } = useResponsiveLayout();
  const reduceMotion = usePrefersReducedMotion();
  const overlayActions = (forcePhoneLayout || !isTablet) && showActions && !flush;
  const hideProfileInActions = hideProfileOnWebTablet && IS_WEB && isTablet && !forcePhoneLayout;
  const isWeb = Platform.OS === 'web';
  const useFlush = flush || (IS_WEB && isTablet && !forcePhoneLayout);

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    band: useFlush
      ? {
          position: 'relative' as const,
          width: '100%' as const,
          backgroundColor: 'transparent',
        }
      : {
          borderRadius: radii.lg,
          backgroundColor: colors.surface,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.separator,
          position: 'relative' as const,
          overflow: 'hidden' as const,
        },
    bandBody: {
      paddingHorizontal: useFlush ? 0 : spacing.lg,
      paddingTop: useFlush ? spacing.xs : spacing.lg,
      paddingBottom: pulse && !useFlush ? spacing.md : useFlush ? spacing.sm : spacing.lg,
    },
    softDivider: {
      marginTop: spacing.md,
    },
    row: {
      position: 'relative' as const,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      width: '100%' as const,
    },
    identity: {
      flex: 1,
      minWidth: 0,
      gap: spacing.xs,
    },
    identityStack: {
      gap: 4,
    },
    actionsCorner: {
      position: 'absolute' as const,
      top: spacing.sm,
      right: spacing.sm,
      zIndex: 2,
    },
    actionsInline: {
      flexShrink: 0,
      alignSelf: 'center' as const,
    },
    statusRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      marginTop: 2,
    },
    statusPressable: {
      alignSelf: 'flex-start' as const,
      ...webPointer(),
    },
    statusLine: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelSecondary,
    },
    statusLineMuted: {
      color: colors.labelTertiary,
    },
    contextRow: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.xs,
      marginTop: 2,
    },
    chip: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
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
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    pulseDivider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginTop: useFlush ? spacing.sm : 0,
    },
    pulseRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      minHeight: 44,
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
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: colors.primarySubtle,
      flexShrink: 0,
    },
    pulseLabel: {
      flex: 1,
      minWidth: 0,
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelPrimary,
    },
    pulseChevron: {
      flexShrink: 0,
      opacity: 0.45,
    },
  }));

  const handlePulsePress = useCallback(() => {
    if (!pulse) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulse.onPress();
  }, [pulse]);

  const handleStatusPress = useCallback(() => {
    if (!onStatusPress) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onStatusPress();
  }, [onStatusPress]);

  const trimmedIdentity = identityLine?.trim() || null;
  const trimmedStatus = statusLine?.trim() || null;

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
        <DashboardHeroName
          displayName={displayName}
          namePlaceholder={namePlaceholder}
          size={useFlush ? 'page' : 'hero'}
        />
      </HeroStaggerBlock>
      <HeroStaggerBlock delayMs={40} reduceMotion={reduceMotion}>
        <DashboardHeroSubtitle subtitle={subtitle} detail={trimmedIdentity} />
      </HeroStaggerBlock>
      {statusBadge || trimmedStatus ? (
        <HeroStaggerBlock delayMs={80} reduceMotion={reduceMotion}>
          <View style={styles.statusRow}>
            {statusBadge}
            {trimmedStatus ? (
              onStatusPress ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={trimmedStatus}
                  onPress={handleStatusPress}
                  style={({ pressed, hovered }) => [
                    styles.statusPressable,
                    webHover(hovered, pressed, webListRowHoverStyles(colors)),
                    pressed && { opacity: 0.85 },
                  ]}>
                  <Text style={styles.statusLine} numberOfLines={1}>
                    {trimmedStatus}
                  </Text>
                </Pressable>
              ) : (
                <Text style={[styles.statusLine, styles.statusLineMuted]} numberOfLines={1}>
                  {trimmedStatus}
                </Text>
              )
            ) : null}
          </View>
        </HeroStaggerBlock>
      ) : null}
    </View>
  );

  const identity = (
    <View style={styles.identity}>
      {identityCore}
      {contextContent}
    </View>
  );

  const actions = showActions ? (
    <View style={styles.actionsInline}>
      <DashboardHeroActions
        profileHref={profileHref}
        avatarKind={avatarKind}
        displayName={displayName}
        photoUri={photoUri}
        compact
        hideProfile={hideProfileInActions || useFlush}
        hideSignOut={hideProfileInActions || useFlush}
      />
    </View>
  ) : null;

  const pulseFooter = pulse && !trimmedStatus && !statusBadge ? (
    <HeroStaggerBlock delayMs={120} reduceMotion={reduceMotion}>
      <View>
        {!useFlush ? <View style={styles.pulseDivider} /> : null}
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
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.labelTertiary}
            style={styles.pulseChevron}
          />
        </Pressable>
      </View>
    </HeroStaggerBlock>
  ) : null;

  return (
    <View style={styles.band}>
      {overlayActions ? <View style={styles.actionsCorner}>{actions}</View> : null}
      <View style={styles.bandBody}>
        <View style={styles.row}>
          {identity}
          {!overlayActions ? actions : null}
        </View>
      </View>
      {pulseFooter}
      {useFlush ? <SoftEdgeDivider style={styles.softDivider} /> : null}
    </View>
  );
}
