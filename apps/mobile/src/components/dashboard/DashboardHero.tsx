import * as Haptics from 'expo-haptics';
import { router, type Href } from 'expo-router';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCallback, type ReactNode } from 'react';

import { DashboardHeroActions } from '@/components/dashboard/DashboardHeroActions';
import {
  DashboardHeroName,
  DashboardHeroSubtitle,
} from '@/components/dashboard/DashboardHeroIdentity';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { IS_WEB } from '@/lib/webPressableStyles';
import { fontRegular, fontSemibold, useThemedStyles } from '@/theme';

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
  contextLine,
  contextSlot,
  showActions = true,
  hideProfileOnWebTablet = false,
}: DashboardHeroProps) {
  const { isTablet } = useResponsiveLayout();
  const overlayActions = !isTablet && showActions;
  const heroOpensProfile = Platform.OS !== 'web';
  const hideProfileInActions = hideProfileOnWebTablet && IS_WEB && isTablet;

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    band: {
      borderRadius: radii.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.separator,
      position: 'relative' as const,
      ...(overlayActions
        ? null
        : {
            paddingHorizontal: spacing.lg,
            paddingVertical: spacing.lg,
          }),
    },
    bandContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
      paddingTop: spacing.lg,
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
      gap: spacing.xs + 2,
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
  }));

  const openProfile = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(profileHref);
  }, [profileHref]);

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
      <Text style={styles.greeting} accessibilityRole="text">
        {getTimeOfDayGreeting(greetingName)}
      </Text>
      <DashboardHeroName displayName={displayName} namePlaceholder={namePlaceholder} />
      <DashboardHeroSubtitle
        subtitle={subtitle}
        detail={trimmedIdentity}
        trailing={hasContext || trimmedIdentity ? undefined : formatDashboardDate()}
      />
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
    </View>
  );
}
