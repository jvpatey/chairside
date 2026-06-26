import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_FILLINS } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

export function FillInSettingsLink() {
  const { workerProfile } = useWorkerProfile();
  const fillInsOn = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.md },
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  return (
    <View style={styles.content}>
      <Text style={styles.hint}>
        Fill-in availability, alert modes, and SMS are managed on the Fill-ins tab.
      </Text>
      <ProfileSettingsRow
        icon="calendar-outline"
        title="Fill-in availability"
        subtitle={fillInsOn ? 'Open to fill-in shifts' : 'Not available for fill-ins'}
        onPress={() => router.push(WORKER_FILLINS)}
        embedded
      />
    </View>
  );
}
