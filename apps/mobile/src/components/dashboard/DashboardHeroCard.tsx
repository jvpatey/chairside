import { getProvinceLabel } from '@chairside/config';
import { type Href } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { ProfileHeaderButton } from '@/components/navigation/ProfileHeaderButton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { fontBold, fontRegular, fontSemibold, useThemedStyles } from '@/theme';

type DashboardHeroCardProps = {
  profileHref: Href;
  avatarKind: 'worker' | 'clinic';
  displayName?: string | null;
  photoUri?: string | null;
  namePlaceholder: string;
  province?: string;
  showProvinceBadge?: boolean;
};

export function DashboardHeroCard({
  profileHref,
  avatarKind,
  displayName,
  photoUri,
  namePlaceholder,
  province = 'NS',
  showProvinceBadge = false,
}: DashboardHeroCardProps) {
  const name = displayName?.trim();
  const greeting = getTimeOfDayGreeting();
  const showSignOut = Platform.OS === 'web';

  const styles = useThemedStyles(({ colors, spacing, radii, elevation }) => ({
    hero: {
      marginBottom: spacing.xs,
    },
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
    location: {
      fontSize: 14,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600',
      color: colors.labelSecondary,
      marginTop: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
      paddingTop: 2,
    },
    avatarRing: {
      borderRadius: radii.pill,
      padding: 2,
      backgroundColor: colors.primarySubtle,
      ...elevation('subtle'),
    },
  }));

  return (
    <View style={styles.hero}>
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
          {showProvinceBadge ? (
            <Text style={styles.location}>{getProvinceLabel(province)}</Text>
          ) : null}
        </View>
        <View style={styles.actions}>
          <View style={styles.avatarRing}>
            <ProfileHeaderButton
              href={profileHref}
              placement="hero"
              avatarKind={avatarKind}
              displayName={name}
              photoUri={photoUri}
            />
          </View>
          <NotificationBell placement="hero" />
          {showSignOut ? <SignOutHeaderButton /> : null}
        </View>
      </View>
    </View>
  );
}
