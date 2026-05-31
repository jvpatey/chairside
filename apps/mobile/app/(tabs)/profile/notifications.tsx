import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { FillInSettingsLink } from '@/components/worker/FillInSettingsLink';
import { WorkerJobNotificationPreferences } from '@/components/worker/WorkerJobNotificationPreferences';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';
import { useThemedStyles } from '@/theme';

export default function WorkerProfileNotificationsScreen() {
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
  }));

  return (
    <ProfileDetailScreen
      title="Notifications"
      subtitle="Choose which alerts send push notifications. In-app history stays available."
      onBack={() => router.back()}>
      <View style={styles.section}>
        <Text style={styles.label}>Push alerts</Text>
        <NotificationCategoryPreferences
          categories={[
            NOTIFICATION_PREFERENCE_CATEGORIES.messages,
            NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
            NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
            NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
          ]}
        />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Permanent roles</Text>
        <WorkerJobNotificationPreferences />
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Fill-in shifts</Text>
        <FillInSettingsLink />
      </View>
    </ProfileDetailScreen>
  );
}
