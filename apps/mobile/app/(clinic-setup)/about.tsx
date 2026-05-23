import { router } from 'expo-router';
import { CLINIC_SETUP_REVIEW } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useThemedStyles } from '@/theme';

export default function ClinicAboutScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const [description, setDescription] = useState('');
  const [website, setWebsite] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    step: { marginBottom: spacing.sm },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setDescription(clinicProfile.description ?? '');
    setWebsite(clinicProfile.website ?? '');
  }, [clinicProfile]);

  const handleContinue = async () => {
    setIsSubmitting(true);
    try {
      await save({
        description: description.trim() || null,
        website: website.trim() || null,
      });
      router.push(CLINIC_SETUP_REVIEW);
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isClinicProfileReady) return null;

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
        title="About your clinic"
        subtitle="Optional details that help candidates learn more."
        onBack={() => router.back()}
      />
      <Text style={styles.step}>Step 4 of 5</Text>
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
