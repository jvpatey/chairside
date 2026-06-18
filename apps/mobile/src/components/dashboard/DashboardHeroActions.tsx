import { type Href } from 'expo-router';
import { Platform, View } from 'react-native';

import { ProfileHeaderButton } from '@/components/navigation/ProfileHeaderButton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { useThemedStyles } from '@/theme';

type DashboardHeroActionsProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
};

export function DashboardHeroActions({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
}: DashboardHeroActionsProps) {
  const name = displayName?.trim();
  const showSignOut = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii }) => ({
    actionsCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      flexShrink: 0,
    },
    avatarRing: {
      borderRadius: radii.pill,
      padding: 2,
      borderWidth: 2,
      borderColor: `${colors.primary}44`,
    },
    signOutWrap: {
      marginLeft: spacing.xs,
    },
  }));

  return (
    <LiquidGlassSurface borderRadius={22} style={styles.actionsCluster}>
      <View style={styles.avatarRing}>
        <ProfileHeaderButton
          href={profileHref}
          placement="hero"
          avatarKind={avatarKind}
          displayName={name}
          photoUri={photoUri}
        />
      </View>
      <NotificationBell placement="hero" embedded />
      {showSignOut ? (
        <View style={styles.signOutWrap}>
          <SignOutHeaderButton />
        </View>
      ) : null}
    </LiquidGlassSurface>
  );
}
