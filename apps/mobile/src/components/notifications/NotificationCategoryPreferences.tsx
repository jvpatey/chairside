import type { NotificationPreferenceCategory } from '@chairside/config';
import { NOTIFICATION_PREFERENCE_CATEGORY_LABELS } from '@chairside/config';
import { Alert, Platform, Switch, Text, View } from 'react-native';

import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useTheme, useThemedStyles } from '@/theme';

type NotificationCategoryPreferencesProps = {
  categories: NotificationPreferenceCategory[];
};

export function NotificationCategoryPreferences({
  categories,
}: NotificationCategoryPreferencesProps) {
  const { colors } = useTheme();
  const { isPushEnabled, setPushEnabled, savingCategory, isLoading } = useNotificationPreferences();

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      gap: spacing.md,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
    },
    rowText: { flex: 1, gap: 2 },
    rowTitle: { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    rowHint: { fontSize: 13, lineHeight: 18, color: colors.labelSecondary },
  }));

  const persist = async (category: NotificationPreferenceCategory, value: boolean) => {
    try {
      await setPushEnabled(category, value);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Please try again.';
      if (Platform.OS !== 'web') {
        Alert.alert('Could not save', message);
      }
    }
  };

  const getCategoryCopy = (category: NotificationPreferenceCategory) => {
    const meta = NOTIFICATION_PREFERENCE_CATEGORY_LABELS[category];
    if (Platform.OS !== 'web') {
      return meta;
    }

    return {
      title: meta.title,
      hint: meta.hint
        .replace(/^Push when/, 'In-app alerts when')
        .replace(/^Push for/, 'In-app alerts for'),
    };
  };

  return (
    <View style={styles.card}>
      {categories.map((category, index) => {
        const meta = getCategoryCopy(category);
        const enabled = isPushEnabled(category);
        const isSaving = savingCategory === category;

        return (
          <View key={category} style={index > 0 ? [styles.row, styles.rowBorder] : styles.row}>
            <View style={styles.rowText}>
              <Text style={styles.rowTitle}>{meta.title}</Text>
              <Text style={styles.rowHint}>{meta.hint}</Text>
            </View>
            <Switch
              value={enabled}
              disabled={isLoading || isSaving}
              onValueChange={(value) => {
                void persist(category, value);
              }}
              trackColor={{ false: colors.fillSubtle, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.fillSubtle}
            />
          </View>
        );
      })}
    </View>
  );
}
