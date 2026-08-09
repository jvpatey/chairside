import {
  SPECIALTY_OPTIONS,
  TEAM_SIZE_RANGE_OPTIONS,
  normalizePracticeDoctors,
  type ClinicSpecialty,
  type PracticeDoctor,
  type TeamSizeRange,
} from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_SETUP_ABOUT } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { SoftwareUsedSelector } from '@/components/clinic/SoftwareUsedSelector';
import { PracticeDoctorsInput } from '@/components/clinic/PracticeDoctorsInput';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { FormSectionHeader } from '@/components/ui/FormSectionHeader';
import { FormScreen } from '@/components/ui/FormScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { useSetupStepProgress } from '@/hooks/useSetupStepProgress';
import { validateClinicPracticeStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

export default function ClinicPracticeScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const setupFormProps = useSetupFormScreenProps('clinic');
  const progress = useSetupStepProgress('practice', { role: 'clinic' });
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

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.lg },
    section: { gap: spacing.sm },
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
    <FormScreen
      {...setupFormProps}
      title="Practice details"
      subtitle="Help candidates understand your clinic."
      onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
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
      {progress.visible ? (
        <SetupStepProgress step={progress.step} total={progress.total} />
      ) : null}
      <View style={styles.form}>
        <View style={styles.section}>
          <FormSectionHeader
            icon="medkit-outline"
            label="Specialty"
            hint="Defaults to General dentistry if unchanged."
          />
          <ChipSelector
            options={SPECIALTY_OPTIONS}
            selected={specialty}
            onChange={(value) => setSpecialty(value as ClinicSpecialty)}
          />
        </View>
        <AuthField
          label="Operatories"
          placeholder="4"
          value={operatories}
          onChangeText={setOperatories}
          keyboardType="number-pad"
          icon="grid-outline"
        />
        <View style={styles.section}>
          <FormSectionHeader icon="people-outline" label="Team size" />
          <ChipSelector
            options={TEAM_SIZE_RANGE_OPTIONS}
            selected={teamSizeRange}
            onChange={(value) => setTeamSizeRange(value as TeamSizeRange)}
          />
        </View>
        <SoftwareUsedSelector
          value={softwareUsed}
          onChange={setSoftwareUsed}
          required
          showValidation={showValidation}
        />
        <PracticeDoctorsInput value={practiceDoctors} onChange={setPracticeDoctors} />
      </View>
    </FormScreen>
  );
}
