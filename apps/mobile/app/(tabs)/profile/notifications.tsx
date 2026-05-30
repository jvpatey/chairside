import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { FillInSettingsLink } from '@/components/worker/FillInSettingsLink';
import { WorkerJobNotificationPreferences } from '@/components/worker/WorkerJobNotificationPreferences';
import { useThemedStyles } from '@/theme';

export default function WorkerProfileNotificationsScreen() {
  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
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
      subtitle="Job alerts and fill-in availability."
      onBack={() => router.back()}>
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
