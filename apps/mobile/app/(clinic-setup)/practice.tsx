import {
  SPECIALTY_OPTIONS,
  SOFTWARE_OPTIONS,
  TEAM_SIZE_RANGE_OPTIONS,
  normalizePracticeDoctors,
  resolveSoftwareSelection,
  type ClinicSpecialty,
  type PracticeDoctor,
  type TeamSizeRange,
} from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_SETUP_ABOUT } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { PracticeDoctorsInput } from '@/components/clinic/PracticeDoctorsInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { validateClinicPracticeStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

export default function ClinicPracticeScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const [specialty, setSpecialty] = useState<ClinicSpecialty>('general');
  const [softwareUsed, setSoftwareUsed] = useState<string[]>([]);
  const [operatories, setOperatories] = useState('');
  const [teamSizeRange, setTeamSizeRange] = useState<TeamSizeRange | null>(null);
  const [practiceDoctors, setPracticeDoctors] = useState<PracticeDoctor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useClinicSetupStepGuard('practice', clinicProfile, isClinicProfileReady, isEditMode);

  const validation = validateClinicPracticeStep(softwareUsed);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
    label: {
      ...typography.body,
      fontWeight: '600',
    },
    hint: typography.subtitle,
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setSpecialty(clinicProfile.specialty ?? 'general');
    setSoftwareUsed(clinicProfile.software_used ?? []);
    setOperatories(clinicProfile.operatories_count?.toString() ?? '');
    setTeamSizeRange(clinicProfile.team_size_range ?? null);
    setPracticeDoctors(normalizePracticeDoctors(clinicProfile.practice_doctors ?? []));
  }, [clinicProfile]);

  const handleContinue = async () => {
    if (!validation.ok) {
      setShowValidation(true);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await save({
        specialty,
        software_used: softwareUsed,
        operatories_count: operatories ? Number(operatories) : null,
        team_size_range: teamSizeRange,
        practice_doctors: practiceDoctors,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(CLINIC_SETUP_ABOUT);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClinicProfileReady) return null;

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={validation.ok}
          validationMessage={validation.message}
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title="Practice details"
        subtitle="Help candidates understand your clinic."
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={3} total={5} /> : null}
      <View style={styles.form}>
        <View style={styles.section}>
          <Text style={styles.label}>Specialty</Text>
          <Text style={styles.hint}>Defaults to General dentistry if unchanged.</Text>
          <ChipSelector
            options={SPECIALTY_OPTIONS}
            selected={specialty}
            onChange={(value) => setSpecialty(value as ClinicSpecialty)}
          />
        </View>
        <AuthField
          label="Operatories (optional)"
          placeholder="4"
          value={operatories}
          onChangeText={setOperatories}
          keyboardType="number-pad"
        />
        <View style={styles.section}>
          <Text style={styles.label}>Team size (optional)</Text>
          <ChipSelector
            options={TEAM_SIZE_RANGE_OPTIONS}
            selected={teamSizeRange}
            onChange={(value) => setTeamSizeRange(value as TeamSizeRange)}
          />
        </View>
        <View style={styles.section}>
          <Text style={styles.label}>Software used</Text>
          <ChipSelector
            options={SOFTWARE_OPTIONS.map((item) => ({ value: item, label: item }))}
            selected={softwareUsed}
            multiple
            onChange={(value) =>
              setSoftwareUsed(resolveSoftwareSelection(softwareUsed, value as string[]))
            }
          />
        </View>
        <PracticeDoctorsInput value={practiceDoctors} onChange={setPracticeDoctors} />
      </View>
    </OnboardingShell>
  );
}
