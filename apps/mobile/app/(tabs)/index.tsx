import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { APP_NAME } from '@/constants';
import { useThemedStyles } from '@/theme';

export default function HomeScreen() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    badge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.secondarySubtle,
      borderRadius: 6,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    badgeText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.secondary,
    },
    cardTitle: {
      ...typography.body,
      fontWeight: '600',
    },
    cardBody: typography.subtitle,
  }));

  return (
    <Screen
      title="Home"
      subtitle="Your dental staffing hub for Nova Scotia.">
      <View style={styles.card}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>Nova Scotia</Text>
        </View>
        <Text style={styles.cardTitle}>Welcome to {APP_NAME}</Text>
        <Text style={styles.cardBody}>
          Browse jobs and temp shifts, manage your profile, and stay on top of new
          opportunities.
        </Text>
      </View>
    </Screen>
  );
}
