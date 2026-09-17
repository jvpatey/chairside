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
import { PillBadge } from '@/components/ui/PillBadge';
import { AvailabilityScheduleSummary } from '@/components/worker/AvailabilityScheduleSummary';
import { FillInAvailabilityPrimaryToggle } from '@/components/worker/FillInAvailabilityPrimaryToggle';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { FILL_IN_ICON } from '@/lib/fillInIcons';
import {
  getFillInAvailabilityCollapsedSummary,
  getFillInSmsStatus,
} from '@/lib/fillInAvailabilitySummary';
import { WORKER_FILLIN_AVAILABILITY, WORKER_SETUP_AVAILABILITY_SCHEDULE } from '@/lib/routing';
import { colorWithAlpha, useTheme, useThemedStyles } from '@/theme';

function navigateToManageAvailability() {
  router.push(WORKER_FILLIN_AVAILABILITY);
}

function navigateToEditSchedule() {
  router.push(WORKER_SETUP_AVAILABILITY_SCHEDULE);
}

export function FillInAvailabilitySummaryCard() {
  const { colors, isDark } = useTheme();
  const { workerProfile, availabilityBlocks } = useWorkerProfile();
  const summary = getFillInAvailabilityCollapsedSummary(workerProfile, availabilityBlocks);
  const isAvailable = workerProfile?.short_notice_available ?? false;
  const { smsActive } = getFillInSmsStatus(workerProfile);
  const showSmsEnablement = isAvailable && !smsActive;

  const styles = useThemedStyles(({ spacing, typography, colors }) => ({
    stack: {
      gap: spacing.lg,
    },
    body: {
      gap: spacing.sm,
    },
    hint: profileSettingsHintStyle({ typography, colors }),
    statusRow: {
      gap: spacing.sm,
    },
    statusValue: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    statusPositive: {
      color: colors.success,
    },
    statusNegative: {
      color: colors.destructive,
    },
    statusSeparator: {
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    daysCardMuted: {
      opacity: 0.55,
    },
  }));

  return (
    <View style={styles.stack}>
      <ProfileSettingsCard
        title="Available for fill-ins"
        icon={FILL_IN_ICON.outline}
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
            <View style={styles.statusRow}>
              <Text style={styles.statusValue}>
                {summary.primarySegments.map((segment, index) => (
                  <Text key={`${segment.text}-${index}`}>
                    {index > 0 ? <Text style={styles.statusSeparator}> · </Text> : null}
                    <Text
                      style={
                        segment.tone === 'positive'
                          ? styles.statusPositive
                          : segment.tone === 'negative'
                            ? styles.statusNegative
                            : null
                      }>
                      {segment.text}
                    </Text>
                  </Text>
                ))}
              </Text>
              {smsActive ? (
                <PillBadge
                  label="Text alerts on"
                  color={colors.secondary}
                  backgroundColor={colorWithAlpha(colors.secondary, isDark ? 0.16 : 0.1)}
                  borderColor={colorWithAlpha(colors.secondary, isDark ? 0.28 : 0.18)}
                  size="sm"
                  showDot
                />
              ) : null}
            </View>
          </FieldBlock>
          <FieldDivider />
          {showSmsEnablement ? (
            <>
              <ProfileSettingsRow
                embedded
                icon="chatbubble-ellipses-outline"
                title="Get fill-ins by text"
                subtitle="Faster alerts for urgent shifts"
                iconColor={colors.secondary}
                iconBackgroundColor={colors.secondarySubtle}
                onPress={navigateToManageAvailability}
              />
              <FieldDivider />
            </>
          ) : null}
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
