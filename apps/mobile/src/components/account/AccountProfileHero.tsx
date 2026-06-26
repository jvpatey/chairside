import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { useTheme, useThemedStyles } from '@/theme';

type AccountProfileHeroProps = {
  displayName?: string | null;
  email?: string | null;
  accountTypeLabel: string;
  icon?: keyof typeof Ionicons.glyphMap;
};

export function AccountProfileHero({
  displayName,
  email,
  accountTypeLabel,
  icon = 'person-circle-outline',
}: AccountProfileHeroProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.fillSubtle,
      marginBottom: spacing.xs,
    },
    name: {
      ...typography.title,
      fontSize: 22,
      lineHeight: 28,
      textAlign: 'center',
    },
    email: {
      ...typography.subtitle,
      fontSize: 15,
      lineHeight: 20,
      textAlign: 'center',
    },
    emailPlaceholder: {
      ...typography.subtitle,
      fontSize: 15,
      textAlign: 'center',
      fontStyle: 'italic',
    },
  }));

  const trimmedName = displayName?.trim();
  const trimmedEmail = email?.trim();

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      {trimmedName ? (
        <Text style={styles.name} numberOfLines={2}>
          {trimmedName}
        </Text>
      ) : null}
      {trimmedEmail ? (
        <Text style={styles.email} numberOfLines={2}>
          {trimmedEmail}
        </Text>
      ) : (
        <Text style={styles.emailPlaceholder}>No email on file</Text>
      )}
      <AccountTypeBadge label={accountTypeLabel} />
    </View>
  );
}
