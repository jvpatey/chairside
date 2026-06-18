import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
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
import { getFillInHeroGradient, useTheme, useThemedStyles } from '@/theme';

function AvailabilityScheduleHeroGlow() {
  const { colors, isDark } = useTheme();
  const gradient = getFillInHeroGradient(colors, isDark);

  return (
    <LinearGradient
      colors={gradient}
      locations={[0, 0.55, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}

export default function WorkerAvailabilityScheduleScreen() {
  const { availabilityBlocks, isWorkerProfileReady } = useWorkerProfile();
  const { saveBlocks } = useWorkerAvailabilitySave();
  const [days, setDays] = useState<DayAvailability[]>(createDefaultDayAvailability());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    footer: { gap: spacing.md, marginTop: spacing.lg },
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
      backgroundAccessory={<AvailabilityScheduleHeroGlow />}
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : 'Save available days'}
            disabled={isSubmitting}
            accent="secondary"
            onPress={handleSave}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Available days"
        subtitle="Choose the days of the week and hours you can cover fill-in shifts."
        accent="secondary"
        onBack={() => router.back()}
      />
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.hint}>
            Clinics and alerts use these days when you limit notifications to matching days only.
          </Text>
          <AvailabilityScheduleInput days={days} onChange={setDays} />
        </View>
      </View>
    </OnboardingShell>
  );
}
