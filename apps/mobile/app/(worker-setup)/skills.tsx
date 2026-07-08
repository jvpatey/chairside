import {
  EMPLOYMENT_TYPE_OPTIONS,
  PRACTICE_TYPE_OPTIONS,
  SOFTWARE_OPTIONS,
  TRAVEL_RADIUS_RANGE_OPTIONS,
  resolveSoftwareSelection,
  type TravelRadiusRange,
} from '@chairside/config';
import { router } from 'expo-router';
import { WORKER_SETUP_LOCATION } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useThemedStyles } from '@/theme';

export default function WorkerSkillsScreen() {
  const { profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const [softwareUsed, setSoftwareUsed] = useState<string[]>([]);
  const [practiceTypes, setPracticeTypes] = useState<string[]>([]);
  const [preferredEmployment, setPreferredEmployment] = useState<string[]>([]);
  const [travelRadiusRange, setTravelRadiusRange] = useState<TravelRadiusRange | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useWorkerSetupStepGuard('skills', workerProfile, profile?.display_name, isWorkerProfileReady, isEditMode);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    label: { ...typography.body, fontWeight: '600' },
    hint: typography.subtitle,
  }));

  useEffect(() => {
    if (!workerProfile) return;
    setSoftwareUsed(workerProfile.software_used ?? []);
    setPracticeTypes(workerProfile.practice_types ?? []);
    setPreferredEmployment(workerProfile.preferred_employment_types ?? []);
    setTravelRadiusRange((workerProfile.travel_radius_range as TravelRadiusRange) ?? null);
  }, [workerProfile]);

  const handleContinue = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await save({
        software_used: softwareUsed,
        practice_types: practiceTypes,
        preferred_employment_types: preferredEmployment,
        travel_radius_range: travelRadiusRange,
        travel_radius_km: null,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_LOCATION);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue
          validationMessage={null}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title="Professional background · Skills & preferences"
        subtitle="Help clinics understand your fit."
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={3} total={5} /> : null}
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Software familiarity (optional)</Text>
          <ChipSelector
            options={SOFTWARE_OPTIONS.map((item) => ({ value: item, label: item }))}
            selected={softwareUsed}
            multiple
            onChange={(value) =>
              setSoftwareUsed(resolveSoftwareSelection(softwareUsed, value as string[]))
            }
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Practice types (optional)</Text>
          <ChipSelector
            options={PRACTICE_TYPE_OPTIONS}
            selected={practiceTypes}
            multiple
            onChange={(value) => setPracticeTypes(value as string[])}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Preferred employment (optional)</Text>
          <ChipSelector
            options={EMPLOYMENT_TYPE_OPTIONS}
            selected={preferredEmployment}
            multiple
            onChange={(value) => setPreferredEmployment(value as string[])}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Travel distance (optional)</Text>
          <Text style={styles.hint}>How far you are willing to commute for work.</Text>
          <ChipSelector
            options={[...TRAVEL_RADIUS_RANGE_OPTIONS]}
            selected={travelRadiusRange}
            onChange={(value) => setTravelRadiusRange(value as TravelRadiusRange)}
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
