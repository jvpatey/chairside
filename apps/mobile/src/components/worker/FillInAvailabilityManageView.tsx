import { Text, View } from 'react-native';

import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInSmsPreview } from '@/components/worker/FillInSmsPreview';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { fontSemibold, useThemedStyles } from '@/theme';

export function FillInAvailabilityManageView() {
  const { workerProfile } = useWorkerProfile();
  const { smsActive } = getFillInSmsStatus(workerProfile);

  const styles = useThemedStyles(({ spacing, colors }) => ({
    content: { gap: spacing.lg },
    previewCard: {
      gap: spacing.sm,
    },
    previewLabel: {
      fontSize: 13,
      lineHeight: 18,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.labelTertiary,
    },
  }));

  return (
    <View style={styles.content}>
      <ProfileSettingsCard title="Text alerts" icon="chatbubble-ellipses-outline" iconAccent="primary">
        <FillInModePanel variant="grouped" layout="textAlerts" />
        {smsActive ? (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Example text</Text>
            <FillInSmsPreview />
          </View>
        ) : null}
      </ProfileSettingsCard>
    </View>
  );
}
