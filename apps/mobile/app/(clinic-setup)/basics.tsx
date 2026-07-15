import { router } from 'expo-router';
import { CLINIC_SETUP_LOCATION, CLINIC_SETUP_LOCATIONS } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSignOut } from '@/hooks/useSignOut';
import { getClinicSetupStepNumber } from '@/lib/clinicSetupSteps';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { validateClinicBasicsStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

export default function ClinicBasicsScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const { isSigningOut, signOut } = useSignOut();
  const [clinicName, setClinicName] = useState('');
  const [contactName, setContactName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useClinicSetupStepGuard('basics', clinicProfile, isClinicProfileReady, isEditMode);

  const progress = getClinicSetupStepNumber('basics', isGroup);
  const validation = validateClinicBasicsStep({ clinicName, contactName, phone });

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.md },
    section: { gap: spacing.sm },
    sectionLabel: { ...typography.body, fontWeight: '600' },
    hint: typography.subtitle,
  }));

  useEffect(() => {
    if (!clinicProfile) return;
    const rawName = clinicProfile.clinic_name?.trim() ?? '';
    // Ignore bootstrap placeholders left from account-type setup.
    const isBootstrapPlaceholder =
      !isEditMode && rawName.toLowerCase() === 'clinic';
    setClinicName(isBootstrapPlaceholder ? '' : (clinicProfile.clinic_name ?? ''));
    setContactName(clinicProfile.contact_name ?? '');
    setPhone(clinicProfile.phone ? formatPhoneNumber(clinicProfile.phone) : '');
  }, [clinicProfile, isEditMode]);

  const handleContinue = async () => {
    if (!validation.ok) {
      setShowValidation(true);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await save({
        clinic_name: clinicName.trim(),
        contact_name: contactName.trim() || null,
        phone: phone.trim() || null,
        account_type: isGroup ? 'group' : clinicProfile?.account_type ?? 'individual',
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else if (isGroup) {
        router.push(CLINIC_SETUP_LOCATIONS);
      } else {
        router.push(CLINIC_SETUP_LOCATION);
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
        title={isGroup ? 'Group basics' : 'Clinic basics'}
        subtitle={
          isGroup ? 'Name your clinic group and primary contact.' : 'Tell us about your practice.'
        }
        backLabel={isEditMode ? undefined : isSigningOut ? 'Signing out…' : 'Sign out'}
        onBack={() => (isEditMode ? router.replace(exitHref) : void signOut())}
      />
      {!isEditMode ? <SetupStepProgress step={progress.step} total={progress.total} /> : null}
      <View style={styles.form}>
        <AuthField
          label={isGroup ? 'Group name' : 'Clinic name'}
          placeholder={isGroup ? 'Group or brand name' : 'Practice name'}
          value={clinicName}
          onChangeText={setClinicName}
          autoCapitalize="words"
          autoComplete="off"
          invalid={showValidation && !validation.ok && !clinicName.trim()}
        />
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Contact</Text>
          <Text style={styles.hint}>Phone or contact name required.</Text>
          <AuthField
            label="Contact name"
            placeholder="Office manager or owner"
            value={contactName}
            onChangeText={setContactName}
            autoCapitalize="words"
            invalid={
              showValidation &&
              !validation.ok &&
              !contactName.trim() &&
              !phone.trim()
            }
          />
          <AuthField
            label="Phone"
            placeholder={PHONE_NUMBER_PLACEHOLDER}
            value={phone}
            onChangeText={(text) => setPhone(formatPhoneNumber(text))}
            keyboardType="phone-pad"
            invalid={
              showValidation &&
              !validation.ok &&
              !contactName.trim() &&
              !phone.trim()
            }
          />
        </View>
      </View>
    </OnboardingShell>
  );
}
