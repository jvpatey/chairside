import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { FillInSettingsLink } from '@/components/worker/FillInSettingsLink';
import { WorkerJobNotificationPreferences } from '@/components/worker/WorkerJobNotificationPreferences';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';

const pushAlertsTitle = Platform.OS === 'web' ? 'In-app alerts' : 'Push alerts';

export default function WorkerProfileNotificationsScreen() {
  return (
    <ProfileDetailScreen
      title="Notifications"
      subtitle={
        Platform.OS === 'web'
          ? 'Choose which events show in-app alerts. Notification history stays available.'
          : 'Choose which alerts send push notifications. In-app history stays available.'
      }
      onBack={() => router.back()}>
      <ProfileSettingsCard title={pushAlertsTitle} icon="notifications-outline">
        <NotificationCategoryPreferences
          categories={[
            NOTIFICATION_PREFERENCE_CATEGORIES.messages,
            NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
            NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
            NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
          ]}
        />
      </ProfileSettingsCard>

      <ProfileSettingsCard title="Permanent roles" icon="briefcase-outline">
        <WorkerJobNotificationPreferences />
      </ProfileSettingsCard>

      <ProfileSettingsCard title="Fill-in shifts" icon="calendar-outline">
        <FillInSettingsLink />
      </ProfileSettingsCard>
    </ProfileDetailScreen>
  );
}
