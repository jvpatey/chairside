import { router } from 'expo-router';
import { Text, View } from 'react-native';

import {
  FieldBlock,
  FieldDivider,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfileSettingsCard } from '@/components/profile/ProfileSettingsCard';
import { ProfileSettingsRow } from '@/components/profile/ProfileSettingsRow';
import { EditPillButton } from '@/components/ui/EditPillButton';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInAvailabilityPrimaryToggle } from '@/components/worker/FillInAvailabilityPrimaryToggle';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { getFillInAvailabilityCollapsedSummary } from '@/lib/fillInAvailabilitySummary';
import { WORKER_FILLIN_AVAILABILITY, WORKER_SETUP_AVAILABILITY_SCHEDULE } from '@/lib/routing';
import { useTheme, useThemedStyles } from '@/theme';

function navigateToManageAvailability() {
  router.push(WORKER_FILLIN_AVAILABILITY);
}

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

export function FillInAvailabilitySummaryCard() {
  const { colors } = useTheme();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const summary = getFillInAvailabilityCollapsedSummary(workerProfile, availabilityBlocks);
  const isAvailable = workerProfile?.short_notice_available ?? false;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    stack: {
      gap: spacing.lg,
    },
    body: {
      gap: spacing.sm,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
    statusValue: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    statusPositive: {
      color: colors.success,
    },
    daysCardMuted: {
      opacity: 0.55,
    },
  }));

  return (
    <View style={styles.stack}>
      <ProfileSettingsCard
        title="Available for fill-ins"
        icon="flash-outline"
        iconAccent="secondary"
        collapsible
        headerAccessory={<FillInAvailabilityPrimaryToggle variant="switchOnly" />}>
        <View style={styles.body}>
          <Text style={styles.hint}>
            {isAvailable
              ? 'You appear open to short-notice fill-in opportunities.'
              : 'Turn on when you can cover urgent shifts.'}
          </Text>
          <FieldBlock label={summary.primaryLabel}>
            <Text
              style={[
                styles.statusValue,
                summary.primaryTone === 'positive' ? styles.statusPositive : null,
              ]}>
              {summary.primary}
            </Text>
          </FieldBlock>
          <FieldDivider />
          <ProfileSettingsRow
            embedded
            icon="settings-outline"
            title="Manage availability"
            subtitle="Alerts, outreach, and notification settings"
            iconColor={colors.secondary}
            iconBackgroundColor={colors.secondarySubtle}
            onPress={navigateToManageAvailability}
          />
        </View>
      </ProfileSettingsCard>

      <ProfileSettingsCard
        key={availabilityBlocks.length === 0 ? 'schedule-empty' : 'schedule-set'}
        title="Available days"
        icon="calendar-outline"
        iconAccent="secondary"
        collapsible
        defaultExpanded={availabilityBlocks.length === 0}
        headerAccessory={<EditPillButton label="Edit days" onPress={navigateToEditSchedule} />}
        style={!isAvailable ? styles.daysCardMuted : undefined}>
        <Text style={styles.hint}>
          {isAvailable
            ? 'Days and hours you can cover fill-in shifts.'
            : 'Turn on fill-ins above, then set which days you can work.'}
        </Text>
        <AvailabilityScheduleSummary blocks={availabilityBlocks} variant="grouped" />
      </ProfileSettingsCard>
    </View>
  );
}
