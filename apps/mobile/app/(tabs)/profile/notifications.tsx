import { router } from 'expo-router';
import { Platform } from 'react-native';

import { ProfileDetailStack } from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';
import { navigateToWorkerProfileHub } from '@/lib/routing';

const channelTitle = Platform.OS === 'web' ? 'In-app' : 'Push';

export default function WorkerProfileNotificationsScreen() {
  return (
    <ProfileDetailScreen
      title="Notifications"
      subtitle={
        Platform.OS === 'web'
          ? 'In-app alerts for fill-ins and matching roles. Texts are under Text alerts.'
          : 'Push and in-app for fill-ins and matching roles. Texts are under Text alerts.'
      }
      onBack={() => navigateToWorkerProfileHub(router)}>
      <ProfileDetailStack>
        <ProfileSettingsCard
          title={channelTitle}
          icon="notifications-outline"
          iconAccent="primary">
          <NotificationCategoryPreferences
            categories={[
              NOTIFICATION_PREFERENCE_CATEGORIES.fillInAlerts,
              NOTIFICATION_PREFERENCE_CATEGORIES.jobAlerts,
            ]}
          />
        </ProfileSettingsCard>
      </ProfileDetailStack>
    </ProfileDetailScreen>
  );
}
