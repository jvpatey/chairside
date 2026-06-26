import { Text, View } from 'react-native';

import { AccountTypeBadge } from '@/components/account/AccountTypeBadge';
import { useThemedStyles } from '@/theme';

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
