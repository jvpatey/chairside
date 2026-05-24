import {
  FILL_IN_NOTIFICATION_MODE_OPTIONS,
  type FillInNotificationMode,
} from '@chairside/config';
import { router } from 'expo-router';
import { WORKER_SETUP_REVIEW } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Pressable, Switch, Text, View } from 'react-native';

import {
  AvailabilityScheduleInput,
  blocksToDayAvailability,
  createDefaultDayAvailability,
  dayAvailabilityToBlocks,
  type DayAvailability,
} from '@/components/worker/AvailabilityScheduleInput';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerAvailabilitySave } from '@/hooks/useWorkerAvailabilitySave';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useTheme, useThemedStyles } from '@/theme';

export default function WorkerAvailabilityScreen() {
  const { colors } = useTheme();
  const { workerProfile, availabilityBlocks, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { saveBlocks } = useWorkerAvailabilitySave();
  const [days, setDays] = useState<DayAvailability[]>(createDefaultDayAvailability());
  const [shortNoticeAvailable, setShortNoticeAvailable] = useState(false);
  const [notificationMode, setNotificationMode] = useState<FillInNotificationMode>('off');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    step: { marginBottom: spacing.sm },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
    hint: typography.subtitle,
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      gap: spacing.md,
    },
    toggleText: { flex: 1, gap: 2 },
    toggleTitle: { ...typography.body, fontWeight: '600', color: colors.labelPrimary },
    toggleHint: { fontSize: 13, color: colors.labelSecondary },
    modeOption: {
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
      backgroundColor: colors.surface,
    },
    modeOptionSelected: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
    },
    modeLabel: { ...typography.body, fontWeight: '600' },
    modeHint: { ...typography.subtitle, fontSize: 13, marginTop: spacing.xs },
  }));

  useEffect(() => {
    if (availabilityBlocks.length > 0) {
      setDays(blocksToDayAvailability(availabilityBlocks));
    }
  }, [availabilityBlocks]);

  useEffect(() => {
    if (!workerProfile) return;
    setShortNoticeAvailable(workerProfile.short_notice_available ?? false);
    setNotificationMode(
      (workerProfile.fill_in_notification_mode as FillInNotificationMode) ?? 'off',
    );
  }, [workerProfile]);

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await save({
        short_notice_available: shortNoticeAvailable,
        fill_in_notification_mode: shortNoticeAvailable ? notificationMode : 'off',
      });
      await saveBlocks(dayAvailabilityToBlocks(days));
      router.push(WORKER_SETUP_REVIEW);
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <OnboardingShell
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Availability"
        subtitle="Set your weekly schedule and fill-in notification preferences."
        onBack={() => router.back()}
      />
      <Text style={styles.step}>Step 5 of 6</Text>
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Weekly schedule</Text>
          <Text style={styles.hint}>Optional — used for fill-in alerts on available days.</Text>
          <AvailabilityScheduleInput days={days} onChange={setDays} />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Short-notice fill-ins</Text>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Available for urgent shifts</Text>
              <Text style={styles.toggleHint}>
                {shortNoticeAvailable ? 'On — you may receive fill-in alerts' : 'Off'}
              </Text>
            </View>
            <Switch
              value={shortNoticeAvailable}
              onValueChange={setShortNoticeAvailable}
              trackColor={{ false: colors.fillSubtle, true: colors.primary }}
              thumbColor={colors.surface}
              ios_backgroundColor={colors.fillSubtle}
            />
          </View>
        </View>

        {shortNoticeAvailable ? (
          <View style={styles.section}>
            <Text style={styles.label}>Fill-in notifications</Text>
            {FILL_IN_NOTIFICATION_MODE_OPTIONS.map((option) => {
              const selected = notificationMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[styles.modeOption, selected && styles.modeOptionSelected]}
                  onPress={() => setNotificationMode(option.value)}>
                  <Text style={styles.modeLabel}>{option.label}</Text>
                  {option.value === 'available_days_only' ? (
                    <Text style={styles.modeHint}>
                      Only notify when the shift overlaps your weekly schedule above.
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>
    </OnboardingShell>
  );
}
