import { getErrorMessage } from '@chairside/api';
import { normalizePracticeDoctors, type PracticeDoctor } from '@chairside/config';
import { router } from 'expo-router';
import { CLINIC_SETUP_REVIEW } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { ClinicLogoSetupField } from '@/components/clinic/ClinicLogoSetupField';
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
import { getClinicSetupStepNumber } from '@/lib/clinicSetupSteps';
import { useThemedStyles } from '@/theme';

export default function ClinicAboutScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup, locations } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const progress = getClinicSetupStepNumber('about', isGroup);
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [practiceDoctors, setPracticeDoctors] = useState<PracticeDoctor[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const activeLocations = locations.filter((location) => location.is_active);

  useClinicSetupStepGuard('about', clinicProfile, isClinicProfileReady, isEditMode);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setDescription(clinicProfile.description ?? '');
    setWebsite(clinicProfile.website ?? '');
    if (isGroup) {
      setPracticeDoctors(normalizePracticeDoctors(clinicProfile.practice_doctors ?? []));
    }
  }, [clinicProfile, isGroup]);

  const handleContinue = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await save({
        description: description.trim() || null,
        website: website.trim() || null,
        // Preserve account type on partial upserts (avoids group → individual flip via trigger defaults).
        account_type: isGroup ? 'group' : (clinicProfile?.account_type ?? 'individual'),
        ...(isGroup
          ? { practice_doctors: normalizePracticeDoctors(practiceDoctors) }
          : {}),
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(CLINIC_SETUP_REVIEW);
      }
    } catch (error) {
      setSubmitError(getErrorMessage(error, 'Could not save. Please try again.'));
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
          canContinue
          validationMessage={null}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title={isGroup ? 'About your group' : 'About your clinic'}
        subtitle={
          isGroup
            ? 'Optional group story, plus doctors assigned to the locations where they work.'
            : 'Optional logo and details that help candidates learn more.'
        }
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={progress.step} total={progress.total} /> : null}
      <View style={styles.form}>
        {!isGroup ? <ClinicLogoSetupField /> : null}
        {isGroup ? (
          <PracticeDoctorsInput
            value={practiceDoctors}
            onChange={setPracticeDoctors}
            locations={activeLocations.map((location) => ({
              id: location.id,
              name: location.name,
            }))}
          />
        ) : null}
        <AuthField
          label="Description"
          placeholder="Tell candidates about your team and culture"
          value={description}
          onChangeText={setDescription}
          autoCapitalize="sentences"
          multiline
        />
        <AuthField
          label="Website (optional)"
          placeholder="https://yourclinic.ca"
          value={website}
          onChangeText={setWebsite}
          keyboardType="url"
          autoCapitalize="none"
        />
      </View>
    </OnboardingShell>
  );
}
