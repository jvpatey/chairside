import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { EditPillButton } from '@/components/ui/EditPillButton';
import { profileSettingsHintStyle } from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInSmsPreview } from '@/components/worker/FillInSmsPreview';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { WORKER_SETUP_AVAILABILITY_SCHEDULE } from '@/lib/routing';
import { webPointer } from '@/lib/webPressableStyles';
import { fontSemibold, useThemedStyles } from '@/theme';

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

export function FillInAvailabilityManageView() {
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const { smsActive, fillInsOn } = getFillInSmsStatus(workerProfile);
  const [moreOpen, setMoreOpen] = useState(false);

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    content: { gap: spacing.lg },
    daysCardMuted: {
      opacity: 0.55,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
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
    moreToggle: {
      alignSelf: 'flex-start' as const,
      paddingVertical: spacing.xs,
      ...webPointer(),
    },
    moreToggleLabel: {
      fontSize: 14,
      lineHeight: 20,
      fontFamily: fontSemibold,
      fontWeight: '600' as const,
      color: colors.primary,
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
        {fillInsOn ? (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: moreOpen }}
              onPress={() => setMoreOpen((open) => !open)}
              style={styles.moreToggle}>
              <Text style={styles.moreToggleLabel}>
                {moreOpen ? 'Hide more options' : 'More options'}
              </Text>
            </Pressable>
            {moreOpen ? (
              <FillInModePanel
                variant="grouped"
                layout="moreOptions"
                hidePrimaryToggle
              />
            ) : null}
          </>
        ) : null}
      </ProfileSettingsCard>

      <ProfileSettingsCard
        title="Available days"
        icon="calendar-outline"
        iconAccent="primary"
        headerAccessory={<EditPillButton label="Edit days" onPress={navigateToEditSchedule} />}
        style={!fillInsOn ? styles.daysCardMuted : undefined}>
        <Text style={styles.hint}>
          {fillInsOn
            ? 'Days and hours you can cover. Used when you limit alerts to matching days.'
            : 'Turn on text alerts above, then choose which days you can cover.'}
        </Text>
        <AvailabilityScheduleSummary blocks={availabilityBlocks} variant="grouped" />
      </ProfileSettingsCard>
    </View>
  );
}
