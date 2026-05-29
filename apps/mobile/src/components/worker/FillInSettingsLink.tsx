import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ProfileSettingsGroup } from '@/components/profile/ProfileSettingsGroup';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_FILLINS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export function FillInSettingsLink() {
  const { workerProfile } = useWorkerProfile();
  const fillInsOn = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    section: { gap: spacing.sm },
    hint: {
      ...typography.subtitle,
      fontSize: 14,
      lineHeight: 20,
      color: colors.labelSecondary,
      paddingHorizontal: spacing.xs,
    },
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.hint}>
        Fill-in availability, alert modes, and SMS are managed on the Fill-ins tab.
      </Text>
      <ProfileSettingsGroup>
        <ProfileSettingsRow
          icon="calendar-outline"
          title="Fill-in availability"
          subtitle={fillInsOn ? 'Open to fill-in shifts' : 'Not available for fill-ins'}
          onPress={() => router.push(WORKER_FILLINS)}
        />
      </ProfileSettingsGroup>
    </View>
  );
}
