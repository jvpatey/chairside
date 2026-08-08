import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { EditPillButton } from '@/components/ui/EditPillButton';
import { profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { WORKER_SETUP_AVAILABILITY_SCHEDULE } from '@/lib/routing';
import { useThemedStyles } from '@/theme';

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

export function FillInAvailabilityManageView() {
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const fillInsAvailable = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.lg },
    daysCardMuted: {
      opacity: 0.55,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
  }));

  return (
    <View style={styles.content}>
      <ProfileSettingsCard
        title="Fill-in alerts"
        icon="notifications-outline"
        iconAccent="secondary">
        <FillInModePanel variant="grouped" />
      </ProfileSettingsCard>
      <ProfileSettingsCard
        title="Available days"
        icon="calendar-outline"
        iconAccent="secondary"
        headerAccessory={<EditPillButton label="Edit days" onPress={navigateToEditSchedule} />}
        style={!fillInsAvailable ? styles.daysCardMuted : undefined}>
        <Text style={styles.hint}>
          {fillInsAvailable
            ? 'The days and hours you can cover fill-in shifts. Used to filter alerts when you choose matching days only.'
            : 'Turn on fill-ins above, then choose which days and hours you can cover temp shifts.'}
        </Text>
        <AvailabilityScheduleSummary blocks={availabilityBlocks} variant="grouped" />
      </ProfileSettingsCard>
    </View>
  );
}
