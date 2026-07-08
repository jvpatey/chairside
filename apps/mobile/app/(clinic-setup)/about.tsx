import { router } from 'expo-router';
import { CLINIC_SETUP_REVIEW } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useThemedStyles } from '@/theme';

export default function ClinicAboutScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useClinicSetupStepGuard('about', clinicProfile, isClinicProfileReady, isEditMode);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setDescription(clinicProfile.description ?? '');
    setWebsite(clinicProfile.website ?? '');
  }, [clinicProfile]);

  const handleContinue = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await save({
        description: description.trim() || null,
        website: website.trim() || null,
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
        title="About your clinic"
        subtitle="Optional details that help candidates learn more."
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={4} total={5} /> : null}
      <View style={styles.form}>
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
