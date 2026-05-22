import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { APP_NAME } from '@/constants';
import { colors, spacing, typography } from '@/theme';

export default function HomeScreen() {
  return (
    <Screen
      title="Home"
      subtitle="Your dental staffing hub for Nova Scotia.">
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Welcome to {APP_NAME}</Text>
        <Text style={styles.cardBody}>
          Browse jobs and temp shifts, manage your profile, and stay on top of new
          opportunities.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  cardBody: typography.subtitle,
});
