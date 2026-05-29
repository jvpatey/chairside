import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { useTheme, useThemedStyles } from '@/theme';

type AccountProfileHeroProps = {
  displayName?: string | null;
  email?: string | null;
  accountTypeLabel: string;
};

export function AccountProfileHero({
  displayName,
  email,
  accountTypeLabel,
}: AccountProfileHeroProps) {
  const { colors } = useTheme();
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      alignItems: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primarySubtle,
      alignItems: 'center',
      justifyContent: 'center',
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
    badge: {
      marginTop: spacing.xs,
      borderRadius: 999,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      backgroundColor: colors.fillSubtle,
    },
    badgeText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
  }));

  const trimmedName = displayName?.trim();
  const trimmedEmail = email?.trim();

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Ionicons name="person" size={32} color={colors.primary} />
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
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{accountTypeLabel} account</Text>
      </View>
    </View>
  );
}
