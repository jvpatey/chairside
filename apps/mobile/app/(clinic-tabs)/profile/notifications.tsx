import { router } from 'expo-router';
import { Platform, Text } from 'react-native';

import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { navigateToClinicProfileHub } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const pushAlertsTitle = Platform.OS === 'web' ? 'In-app alerts' : 'Push alerts';

export default function ClinicProfileNotificationsScreen() {
  const { isGroup, isOwner } = useClinicProfile();
  const isGroupOwner = isGroup && isOwner;
  const styles = useThemedStyles(({ typography, colors }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  const subtitle = isGroupOwner
    ? Platform.OS === 'web'
      ? 'Managers typically handle applications and candidate messages. Turn off alerts here if you don’t want them on the owner login. Notification history stays available.'
      : 'Managers typically handle applications and candidate messages. Turn off alerts here if you don’t want them on the owner login. In-app history stays available.'
    : Platform.OS === 'web'
      ? 'Choose which events show in-app alerts. Notification history stays available.'
      : 'Choose which alerts send push notifications. In-app history stays available.';

  return (
    <ProfileDetailScreen
      title="Notifications"
      subtitle={subtitle}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ProfileSettingsCard title={pushAlertsTitle} icon="notifications-outline">
        <NotificationCategoryPreferences
          categories={[
            NOTIFICATION_PREFERENCE_CATEGORIES.messages,
            NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews,
          ]}
        />
        <Text style={styles.hint}>
          {isGroupOwner
            ? Platform.OS === 'web'
              ? 'Turning Messages or Applications off stops owner alerts while managers keep working those queues. Items still appear in your notification inbox.'
              : 'Turning Messages or Applications off stops owner push while managers keep working those queues. Items still appear in your notification inbox.'
            : Platform.OS === 'web'
              ? 'Application and message notifications still appear in your notification inbox when alerts are off.'
              : 'Application and message notifications still appear in your notification inbox when push is off.'}
        </Text>
      </ProfileSettingsCard>
    </ProfileDetailScreen>
  );
}
