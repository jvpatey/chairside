import { Text, View } from 'react-native';

import { ACCOUNT_DATA_PRIVACY_POINTS } from '@/lib/accountDeletionCopy';
import { useThemedStyles } from '@/theme';

export function AccountDataPrivacyNotice() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    list: {
      gap: spacing.xs,
    },
    bulletRow: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    bullet: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
    bulletText: {
      flex: 1,
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
    },
  }));

  return (
    <View style={styles.list}>
      {ACCOUNT_DATA_PRIVACY_POINTS.map((point) => (
        <View key={point} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{point}</Text>
        </View>
      ))}
    </View>
  );
}
