import { type Href } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { ProfileHeaderButton } from '@/components/navigation/ProfileHeaderButton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { LiquidGlassSurface } from '@/components/ui/LiquidGlassSurface';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { fontBold, fontRegular, useThemedStyles } from '@/theme';

type DashboardHeroCardProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  namePlaceholder: string;
  subtitle: string;
};

export function DashboardHeroCard({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  namePlaceholder,
  subtitle,
}: DashboardHeroCardProps) {
  const name = displayName?.trim();
  const greeting = getTimeOfDayGreeting();
  const showSignOut = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii, typography }) => ({
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    identity: {
      flex: 1,
      gap: 4,
      minWidth: 0,
      paddingTop: 4,
    },
    greeting: {
      fontSize: 15,
      lineHeight: 20,
      fontFamily: fontRegular,
      color: colors.labelSecondary,
    },
    name: {
      fontSize: 34,
      lineHeight: 40,
      fontFamily: fontBold,
      fontWeight: '700',
      color: colors.labelPrimary,
      letterSpacing: -0.6,
      minHeight: 40,
    },
    nameHidden: {
      opacity: 0,
    },
    subtitle: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    actionsCluster: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.xs,
      paddingVertical: spacing.xs,
      flexShrink: 0,
      marginTop: 2,
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
    <View>
      <View style={styles.headerRow}>
        <View style={styles.identity}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text
            style={[styles.name, !name && styles.nameHidden]}
            numberOfLines={2}
            accessibilityElementsHidden={!name}
            importantForAccessibility={name ? 'yes' : 'no-hide-descendants'}>
            {name || namePlaceholder}
          </Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
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
      </View>
    </View>
  );
}
