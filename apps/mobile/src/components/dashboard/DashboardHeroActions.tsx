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
  const pillPadding = compact ? 5 : 6;
  const glassOverlay = colorWithAlpha(colors.surface, isDark ? 0.52 : 0.82);

  const styles = useThemedStyles(({ spacing }) => ({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
    },
    actionsCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 6 : spacing.xs,
      paddingHorizontal: pillPadding,
      paddingVertical: pillPadding,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    signOutWrap: {
      marginLeft: spacing.xs,
    },
  }));

  return (
    <View style={styles.wrap}>
      <LiquidGlassSurface
        borderRadius={999}
        style={styles.actionsCluster}
        overlayColor={glassOverlay}>
        <ProfileHeaderButton
          href={profileHref}
          placement="hero"
          embedded
          avatarKind={avatarKind}
          displayName={name}
          photoUri={photoUri}
          size={buttonSize}
        />
        <NotificationBell placement="hero" embedded size={buttonSize} />
      </LiquidGlassSurface>
      {showSignOut ? (
        <View style={styles.signOutWrap}>
          <SignOutHeaderButton />
        </View>
      ) : null}
    </View>
  );
}
