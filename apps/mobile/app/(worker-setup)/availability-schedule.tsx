import { router } from 'expo-router';
import { WORKER_FILLINS } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

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
import { useThemedStyles } from '@/theme';

export default function WorkerAvailabilityScheduleScreen() {
  const { availabilityBlocks, isWorkerProfileReady } = useWorkerProfile();
  const { saveBlocks } = useWorkerAvailabilitySave();
  const [days, setDays] = useState<DayAvailability[]>(createDefaultDayAvailability());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    label: { ...typography.body, fontWeight: '600' },
    hint: typography.subtitle,
    section: { gap: spacing.sm },
  }));

  useEffect(() => {
    if (availabilityBlocks.length > 0) {
      setDays(blocksToDayAvailability(availabilityBlocks));
    }
  }, [availabilityBlocks]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await saveBlocks(dayAvailabilityToBlocks(days));
      router.replace(WORKER_FILLINS);
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
            label={isSubmitting ? 'Saving…' : 'Save schedule'}
            disabled={isSubmitting}
            onPress={handleSave}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Fill-in availability · Weekly schedule"
        subtitle="Set the days and times you are generally available for temp shifts."
        onBack={() => router.back()}
      />
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Weekly schedule</Text>
          <Text style={styles.hint}>Used when you choose available-days-only fill-in alerts.</Text>
          <AvailabilityScheduleInput days={days} onChange={setDays} />
        </View>
      </View>
    </OnboardingShell>
  );
}
