import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { useThemedStyles } from '@/theme';

export default function BrowseScreen() {
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
      title="Browse"
      subtitle="Jobs and temp shifts will appear here.">
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>No listings yet</Text>
        <Text style={styles.placeholderHint}>
          Job posts and fill-in shifts will show up once the backend is connected.
        </Text>
      </View>
    </Screen>
  );
}
