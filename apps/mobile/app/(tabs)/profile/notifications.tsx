import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ProfileDetailStack } from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { WorkerJobNotificationPreferences } from '@/components/worker/WorkerJobNotificationPreferences';
import { WorkerOpenInquiryPreferences } from '@/components/worker/WorkerOpenInquiryPreferences';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';
import { navigateToWorkerProfileHub } from '@/lib/routing';

const pushAlertsTitle = Platform.OS === 'web' ? 'In-app alerts' : 'Push alerts';

export default function WorkerProfileNotificationsScreen() {
  return (
    <ProfileDetailScreen
      title="Other alerts"
      subtitle={
        Platform.OS === 'web'
          ? 'Push and role preferences. Text alerts are managed separately.'
          : 'Push and role preferences. Text alerts are managed separately.'
      }
      onBack={() => navigateToWorkerProfileHub(router)}>
      <ProfileDetailStack>
        <ProfileSettingsCard
          title={pushAlertsTitle}
          icon="notifications-outline"
          iconAccent="primary">
          <NotificationCategoryPreferences
            categories={[
              NOTIFICATION_PREFERENCE_CATEGORIES.messages,
              NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
              NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
              NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
            ]}
          />
        </ProfileSettingsCard>

        <ProfileSettingsCard title="Role alerts" icon="briefcase-outline" iconAccent="primary">
          <WorkerJobNotificationPreferences />
        </ProfileSettingsCard>

        <ProfileSettingsCard title="Open inquiries" icon="chatbubbles-outline" iconAccent="primary">
          <WorkerOpenInquiryPreferences />
        </ProfileSettingsCard>
      </ProfileDetailStack>
    </ProfileDetailScreen>
  );
}
