import { StyleSheet, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { colors, spacing, typography } from '@/theme';

export default function BrowseScreen() {
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
