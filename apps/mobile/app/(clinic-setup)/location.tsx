import { Redirect, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { FormScreen } from '@/components/ui/FormScreen';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { useSetupFormScreenProps } from '@/hooks/useSetupFormScreenProps';
import { CLINIC_CAPTURE_ADDRESS } from '@/lib/routing';
import { validateAddressStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

function buildFormattedAddress(
  profile: NonNullable<ReturnType<typeof useClinicProfile>['clinicProfile']>,
): string {
  const cityLine = [profile.city, profile.province, profile.postal_code].filter(Boolean).join(', ');
  return [profile.address_line1, cityLine].filter(Boolean).join(', ');
}

function profileToAddress(
  profile: NonNullable<ReturnType<typeof useClinicProfile>['clinicProfile']>,
): AddressFormValue {
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

/** Settings edit only — signup uses /(onboarding)/capture-clinic-address. */
export default function ClinicLocationScreen() {
  const { clinicProfile, isClinicProfileReady, isGroup } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'clinic' });
  const setupFormProps = useSetupFormScreenProps('clinic');
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

  if (!isEditMode) {
    return <Redirect href={CLINIC_CAPTURE_ADDRESS} />;
  }

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
        account_type: isGroup ? 'group' : 'individual',
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
      title="Clinic address"
      subtitle="Your practice location. Add more clinics later under Settings if you need them."
      onBack={() => router.replace(exitHref)}
      footer={
        <SetupStepFooter
          canContinue={validation.ok}
          validationMessage={validation.message}
          showValidation={showValidation}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel="Save changes"
          onContinue={handleContinue}
        />
      }>
      <View style={styles.form}>
        <AddressAutocomplete
          value={address}
          onChange={setAddress}
          required
          sectionIcon="location-outline"
        />
      </View>
    </FormScreen>
  );
}
