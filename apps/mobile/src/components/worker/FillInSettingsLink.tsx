import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import { WORKER_FILLIN_AVAILABILITY } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

export function FillInSettingsLink() {
  const { workerProfile } = useWorkerProfile();
  const { colors } = useTheme();
  const fillInsOn = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.md },
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  return (
    <View style={styles.content}>
      <Text style={styles.hint}>
        Fill-in availability, alert modes, and SMS are managed in fill-in availability settings.
      </Text>
      <ProfileSettingsRow
        icon={FILL_IN_ICON.outline}
        title="Fill-in availability"
        subtitle={fillInsOn ? 'Open to fill-in shifts' : 'Not available for fill-ins'}
        iconColor={colors.secondary}
        iconBackgroundColor={colors.secondarySubtle}
        onPress={() => router.push(WORKER_FILLIN_AVAILABILITY)}
        embedded
      />
    </View>
  );
}
