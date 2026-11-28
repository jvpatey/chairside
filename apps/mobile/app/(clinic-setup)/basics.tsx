import { setClinicAccountType } from '@chairside/api';
import { Redirect, router } from 'expo-router';
import { CLINIC_FINISH_PROFILE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { FormScreen } from '@/components/ui/FormScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { validateClinicBasicsStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

/** Settings edit only — signup uses /(onboarding)/capture-clinic-* screens. */
export default function ClinicBasicsScreen() {
  const { user } = useAuth();
  const { clinicProfile, isClinicProfileReady, refreshClinicProfile } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const setupFormProps = useSetupFormScreenProps('clinic');
  const [clinicName, setClinicName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useClinicSetupStepGuard('basics', clinicProfile, isClinicProfileReady, isEditMode);

  const basicsValidation = validateClinicBasicsStep({ clinicName, phone });

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    const rawName = clinicProfile.clinic_name?.trim() ?? '';
    const isBootstrapPlaceholder = rawName.toLowerCase() === 'clinic';
    setClinicName(isBootstrapPlaceholder ? '' : (clinicProfile.clinic_name ?? ''));
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
  }, [clinicProfile]);

  if (!isEditMode) {
    return <Redirect href={CLINIC_FINISH_PROFILE} />;
  }

  const handleContinue = async () => {
    if (!basicsValidation.ok) {
      setShowValidation(true);
      return;
    }
    if (!user?.id) {
      setSubmitError('Not signed in');
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      if (!clinicProfile?.account_type) {
        await setClinicAccountType(user.id, 'individual', clinicName.trim());
        await refreshClinicProfile();
      }
      await save({
        clinic_name: clinicName.trim(),
        phone: phone.trim() || null,
        account_type: clinicProfile?.account_type ?? 'individual',
      });
      router.replace(exitHref);
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
      title="Clinic basics"
      subtitle="Clinic name and the phone where cover-request texts go."
      onBack={() => router.replace(exitHref)}
      footer={
        <SetupStepFooter
          canContinue={basicsValidation.ok}
          validationMessage={basicsValidation.message}
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel="Save changes"
          onContinue={handleContinue}
        />
      }>
      <View style={styles.form}>
        <AuthField
          label={clinicProfile?.account_type === 'group' ? 'Group name' : 'Clinic name'}
          placeholder={clinicProfile?.account_type === 'group' ? 'Group name' : 'Practice name'}
          value={clinicName}
          onChangeText={setClinicName}
          autoCapitalize="words"
          icon="business-outline"
          required
          invalid={showValidation && !clinicName.trim()}
        />
        <AuthField
          label="Phone"
          placeholder={PHONE_NUMBER_PLACEHOLDER}
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneNumber(text))}
          keyboardType="phone-pad"
          icon="call-outline"
          required
          hint="Where cover-request texts go so you can accept from SMS."
          invalid={showValidation && !basicsValidation.ok && Boolean(clinicName.trim())}
        />
      </View>
    </FormScreen>
  );
}
