import type { NotificationPreferenceCategory } from '@chairside/config';
import { NOTIFICATION_PREFERENCE_CATEGORY_LABELS } from '@chairside/config';
import { Alert, Platform, View } from 'react-native';

import { SettingsToggleRow } from '@/components/ui/SettingsToggleRow';
import { useNotificationPreferences } from '@/hooks/useNotificationPreferences';
import { useThemedStyles } from '@/theme';

type NotificationCategoryPreferencesProps = {
  categories: NotificationPreferenceCategory[];
};

export function NotificationCategoryPreferences({
  categories,
}: NotificationCategoryPreferencesProps) {
  const { isPushEnabled, setPushEnabled, savingCategory, isLoading } = useNotificationPreferences();

  const styles = useThemedStyles(({ colors, spacing }) => ({
    list: {
      gap: 0,
    },
    rowBorder: {
      borderTopWidth: 1,
      borderTopColor: colors.separator,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
    },
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
    <View style={styles.list}>
      {categories.map((category, index) => {
        const meta = getCategoryCopy(category);
        const enabled = isPushEnabled(category);
        const isSaving = savingCategory === category;

        return (
          <View key={category} style={index > 0 ? styles.rowBorder : undefined}>
            <SettingsToggleRow
              title={meta.title}
              hint={meta.hint}
              value={enabled}
              disabled={isLoading || isSaving}
              onValueChange={(value) => {
                void persist(category, value);
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
