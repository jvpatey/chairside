import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { FillInModePanel } from '@/components/worker/FillInModePanel';
import { FillInSmsPreview } from '@/components/worker/FillInSmsPreview';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getFillInSmsStatus } from '@/lib/fillInAvailabilitySummary';
import { webPointer } from '@/lib/webPressableStyles';
import { fontSemibold, useThemedStyles } from '@/theme';

export function FillInAvailabilityManageView() {
  const { workerProfile } = useWorkerProfile();
  const { smsActive, fillInsOn } = getFillInSmsStatus(workerProfile);
  const [moreOpen, setMoreOpen] = useState(false);

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
    </View>
  );
}
