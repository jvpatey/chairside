import { type Href } from 'expo-router';
import { Platform, View } from 'react-native';

import { ProfileHeaderButton } from '@/components/navigation/ProfileHeaderButton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

type DashboardHeroActionsProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  compact?: boolean;
};

export function DashboardHeroActions({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  compact = false,
}: DashboardHeroActionsProps) {
  const { colors, isDark } = useTheme();
  const name = displayName?.trim();
  const showSignOut = Platform.OS === 'web';

  const buttonSize = compact ? 32 : 40;

  const styles = useThemedStyles(({ colors, spacing, radii, isDark }) => ({
    actionsCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 4 : spacing.xs,
      paddingHorizontal: compact ? 6 : spacing.sm,
      paddingVertical: compact ? 5 : spacing.xs + 2,
      flexShrink: 0,
      minHeight: compact ? 42 : 48,
    },
    avatarRing: {
      borderRadius: radii.pill,
      padding: compact ? 1 : 2,
      borderWidth: compact ? 1.5 : 2,
      borderColor: colorWithAlpha(colors.primary, isDark ? 0.55 : 0.4),
      backgroundColor: colorWithAlpha(colors.surface, isDark ? 0.5 : 0.88),
    },
    signOutWrap: {
      marginLeft: spacing.xs,
    },
  }));

  return (
    <LiquidGlassSurface
      borderRadius={compact ? 18 : 22}
      style={styles.actionsCluster}
      overlayColor={colorWithAlpha(colors.surface, isDark ? 0.58 : 0.84)}>
      <View style={styles.avatarRing}>
        <ProfileHeaderButton
          href={profileHref}
          placement="hero"
          avatarKind={avatarKind}
          displayName={name}
          photoUri={photoUri}
          size={buttonSize}
        />
      </View>
      <NotificationBell placement="hero" embedded size={buttonSize} />
      {showSignOut ? (
        <View style={styles.signOutWrap}>
          <SignOutHeaderButton />
        </View>
      ) : null}
    </LiquidGlassSurface>
  );
}
