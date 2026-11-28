import { router } from 'expo-router';
import { Platform, Text } from 'react-native';

import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { NotificationCategoryPreferences } from '@/components/notifications/NotificationCategoryPreferences';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { NOTIFICATION_PREFERENCE_CATEGORIES } from '@chairside/config';
import { navigateToClinicProfileHub } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

const pushAlertsTitle = Platform.OS === 'web' ? 'In-app alerts' : 'Push alerts';

export default function ClinicProfileNotificationsScreen() {
  const styles = useThemedStyles(({ typography, colors }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  const subtitle =
    Platform.OS === 'web'
      ? 'Choose which events show in-app alerts. Notification history stays available.'
      : 'Choose which alerts send push notifications. In-app history stays available.';

  return (
    <ProfileDetailScreen
      title="Notifications"
      subtitle={subtitle}
      onBack={() => navigateToClinicProfileHub(router)}>
      <ProfileSettingsCard title={pushAlertsTitle} icon="notifications-outline" iconAccent="secondary">
        <NotificationCategoryPreferences
          categories={[NOTIFICATION_PREFERENCE_CATEGORIES.applicationsInterviews]}
        />
        <Text style={styles.hint}>
          Items still appear in your notification inbox when alerts are off. Fill-in texts are sent to
          your clinic phone either way.
        </Text>
      </ProfileSettingsCard>
    </ProfileDetailScreen>
  );
}
