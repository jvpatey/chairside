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
  hideProfile?: boolean;
  hideSignOut?: boolean;
};

export function DashboardHeroActions({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  compact = false,
  hideProfile = false,
  hideSignOut = false,
}: DashboardHeroActionsProps) {
  const { colors, isDark } = useTheme();
  const name = displayName?.trim();
  const showSignOut = Platform.OS === 'web' && !hideSignOut;

  const buttonSize = compact ? 32 : 40;
  const pillPadding = compact ? 5 : 6;
  const glassOverlay = colorWithAlpha(colors.surface, isDark ? 0.52 : 0.82);
  const showProfile = !hideProfile;

  const styles = useThemedStyles(({ spacing }) => ({
    actionsCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: compact ? 6 : spacing.xs,
      paddingHorizontal: showProfile || showSignOut ? pillPadding : 0,
      paddingVertical: showProfile || showSignOut ? pillPadding : 0,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
  }));

  const cluster = (
    <>
      {showProfile ? (
        <ProfileHeaderButton
          href={profileHref}
          placement="hero"
          embedded
          avatarKind={avatarKind}
          displayName={name}
          photoUri={photoUri}
          size={buttonSize}
        />
      ) : null}
      <NotificationBell placement="hero" embedded size={buttonSize} />
      {showSignOut ? <SignOutHeaderButton embedded size={buttonSize} /> : null}
    </>
  );

  if (!showProfile && !showSignOut) {
    return <View style={styles.actionsCluster}>{cluster}</View>;
  }

  return (
    <LiquidGlassSurface borderRadius={999} style={styles.actionsCluster} overlayColor={glassOverlay}>
      {cluster}
    </LiquidGlassSurface>
  );
}
