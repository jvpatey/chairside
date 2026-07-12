import { router } from 'expo-router';
import { CLINIC_SETUP_PRACTICE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { validateAddressStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

function buildFormattedAddress(
  profile: NonNullable<ReturnType<typeof useClinicProfile>['clinicProfile']>,
): string {
  const cityLine = [profile.city, profile.province, profile.postal_code].filter(Boolean).join(', ');
  return [profile.address_line1, cityLine].filter(Boolean).join(', ');
}

function profileToAddress(profile: NonNullable<ReturnType<typeof useClinicProfile>['clinicProfile']>): AddressFormValue {
  const address_line1 = profile.address_line1 ?? '';
  const city = profile.city ?? '';
  const postal_code = profile.postal_code ?? '';
  const hasCoordinates = profile.latitude != null && profile.longitude != null;
  const formatted = hasCoordinates && address_line1 ? buildFormattedAddress(profile) : '';

  return {
    address_line1,
    address_line2: profile.address_line2 ?? '',
    city,
    province: profile.province ?? 'NS',
    postal_code,
    latitude: profile.latitude,
    longitude: profile.longitude,
    formatted,
  };
}

export default function ClinicLocationScreen() {
  const { clinicProfile, isClinicProfileReady } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const [address, setAddress] = useState<AddressFormValue>(() =>
    clinicProfile ? profileToAddress(clinicProfile) : createEmptyAddressValue(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  useClinicSetupStepGuard('location', clinicProfile, isClinicProfileReady, isEditMode);

  const validation = validateAddressStep(address);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (clinicProfile) {
      setAddress(profileToAddress(clinicProfile));
    }
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
        address_line1: address.address_line1.trim(),
        address_line2: address.address_line2.trim() || null,
        city: address.city.trim(),
        province: address.province.trim() || 'NS',
        postal_code: address.postal_code.trim(),
        latitude: address.latitude,
        longitude: address.longitude,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(CLINIC_SETUP_PRACTICE);
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
        title="Clinic location"
        subtitle="Where is your practice located?"
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={2} total={5} /> : null}
      <View style={styles.form}>
        <AddressAutocomplete value={address} onChange={setAddress} />
      </View>
    </OnboardingShell>
  );
}
