import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useThemedStyles } from '@/theme';

export default function ProfileScreen() {
  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    placeholder: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.lg,
      gap: spacing.sm,
    },
    placeholderText: {
      ...typography.body,
      fontWeight: '600',
    },
    placeholderHint: typography.subtitle,
  }));

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
