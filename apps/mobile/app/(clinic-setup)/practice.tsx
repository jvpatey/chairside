import { SPECIALTY_OPTIONS, type ClinicSpecialty } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_SETUP_REVIEW } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ChipSelector } from '@/components/clinic/ChipSelector';
import { SoftwareUsedSelector } from '@/components/clinic/SoftwareUsedSelector';
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
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(CLINIC_SETUP_REVIEW);
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
      subtitle="Specialty and software help match you with the right people."
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
        <SoftwareUsedSelector
          value={softwareUsed}
          onChange={setSoftwareUsed}
          required
          showValidation={showValidation}
        />
      </View>
    </FormScreen>
  );
}
