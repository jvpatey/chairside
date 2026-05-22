import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/theme';

export default function ProfileScreen() {
  return (
    <Screen
      title="Profile"
      subtitle="Your professional profile and availability.">
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Profile not set up</Text>
        <Text style={styles.placeholderHint}>
          Worker and clinic onboarding will be added when auth is connected.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  placeholderText: {
    ...typography.body,
    fontWeight: '600',
  },
  placeholderHint: typography.subtitle,
});
