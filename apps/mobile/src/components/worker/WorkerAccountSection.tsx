import { Text, View } from 'react-native';

import { ProfileSection } from '@/components/worker/ProfileSection';
import { useThemedStyles } from '@/theme';

type WorkerAccountSectionProps = {
  displayName?: string | null;
  email?: string | null;
};

export function WorkerAccountSection({ displayName, email }: WorkerAccountSectionProps) {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    row: {
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator,
    },
    label: { fontSize: 13, fontWeight: '600', color: typography.subtitle.color },
    value: typography.body,
  }));

  return (
    <ProfileSection title="Account" subtitle="Your sign-in details and display name.">
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Name</Text>
          <Text style={styles.value}>{displayName?.trim() || '—'}</Text>
        </View>
        <View style={[styles.row, { borderBottomWidth: 0 }]}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{email?.trim() || '—'}</Text>
        </View>
      </View>
    </ProfileSection>
  );
}
