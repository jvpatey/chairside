import { router } from 'expo-router';
import { Platform, Text, View } from 'react-native';

import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';
import { useThemedStyles } from '@/theme';

export default function ClinicProfileNotificationsScreen() {
  const styles = useThemedStyles(({ spacing, colors }) => ({
    section: { gap: spacing.sm },
    label: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
    hint: {
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
  }));

  return (
    <ProfileDetailScreen
      title="Notifications"
      subtitle={
        Platform.OS === 'web'
          ? 'Choose which events show in-app alerts. Notification history stays available.'
          : 'Choose which alerts send push notifications. In-app history stays available.'
      }
      onBack={() => router.back()}>
      <View style={styles.section}>
        <Text style={styles.label}>
          {Platform.OS === 'web' ? 'In-app alerts' : 'Push alerts'}
        </Text>
        <NotificationCategoryPreferences
          categories={[
            NOTIFICATION_PREFERENCE_CATEGORIES.messages,
            NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
          ]}
        />
      </View>
      <Text style={styles.hint}>
        {Platform.OS === 'web'
          ? 'Application and message notifications still appear in your notification inbox when alerts are off.'
          : 'Application and message notifications still appear in your notification inbox when push is off.'}
      </Text>
    </ProfileDetailScreen>
  );
}
