import { router } from 'expo-router';
import {
  CLINIC_HOME,
  CLINIC_SETUP_LOCATION,
} from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { useThemedStyles } from '@/theme';

export default function ClinicBasicsScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const [clinicName, setClinicName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
    footer: { gap: spacing.md, marginTop: spacing.lg },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    setClinicName(clinicProfile.clinic_name ?? '');
    setContactName(clinicProfile.contact_name ?? '');
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
  }, [clinicProfile]);

  const handleContinue = async () => {
    if (!clinicName.trim()) {
      Alert.alert('Missing information', 'Enter your clinic name to continue.');
      return;
    }

    setIsSubmitting(true);
    try {
      await save({
        clinic_name: clinicName.trim(),
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(CLINIC_SETUP_LOCATION);
      }
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
    <OnboardingShell atmosphere="form"
      footer={
        <View style={styles.footer}>
          <OnboardingButton
            label={isSubmitting ? 'Saving…' : isEditMode ? 'Save changes' : 'Continue'}
            disabled={isSubmitting}
            onPress={handleContinue}
          />
        </View>
      }>
      <AuthScreenHeader
        title="Clinic basics"
        subtitle="Tell us about your practice."
        onBack={() =>
          isEditMode ? router.replace(exitHref) : router.replace(CLINIC_HOME)
        }
      />
      {!isEditMode ? <SetupStepProgress step={1} total={5} /> : null}
      <View style={styles.form}>
        <AuthField
          label="Clinic name"
          placeholder="Practice name"
          value={clinicName}
          onChangeText={setClinicName}
          autoCapitalize="words"
        />
        <AuthField
          label="Contact name"
          placeholder="Office manager or owner"
          value={contactName}
          onChangeText={setContactName}
          autoCapitalize="words"
        />
        <AuthField
          label="Phone"
          placeholder={PHONE_NUMBER_PLACEHOLDER}
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneNumber(text))}
          keyboardType="phone-pad"
        />
      </View>
    </OnboardingShell>
  );
}
