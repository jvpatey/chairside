import { getProvinceLabel } from '@chairside/config';
import { type Href } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { ProfileHeaderButton } from '@/components/navigation/ProfileHeaderButton';
import { SignOutHeaderButton } from '@/components/navigation/SignOutHeaderButton';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { getTimeOfDayGreeting } from '@/lib/greeting';
import { useThemedStyles } from '@/theme';

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

  const styles = useThemedStyles(({ spacing, typography }) => ({
    hero: {
      marginBottom: spacing.sm,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    identity: {
      flex: 1,
      gap: 2,
      minWidth: 0,
      paddingTop: 2,
    },
    greeting: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 18,
    },
    name: {
      ...typography.title,
      fontSize: 32,
      lineHeight: 38,
      minHeight: 38,
      marginTop: spacing.xs,
    },
    nameHidden: {
      opacity: 0,
    },
    location: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 18,
      marginTop: spacing.xs,
    },
    actions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flexShrink: 0,
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
          <ProfileHeaderButton
            href={profileHref}
            placement="hero"
            avatarKind={avatarKind}
            displayName={name}
            photoUri={photoUri}
          />
          <NotificationBell placement="hero" />
          {showSignOut ? <SignOutHeaderButton /> : null}
        </View>
      </View>
    </View>
  );
}
