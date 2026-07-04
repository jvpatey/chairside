import { router } from 'expo-router';
import { CLINIC_SETUP_PRACTICE } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
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
  const [address, setAddress] = useState<AddressFormValue>(() =>
    clinicProfile ? profileToAddress(clinicProfile) : createEmptyAddressValue(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
    footer: { gap: spacing.md, marginTop: spacing.lg },
  }));

  useEffect(() => {
    if (clinicProfile) {
      setAddress(profileToAddress(clinicProfile));
    }
  }, [clinicProfile]);

  const handleContinue = async () => {
    if (!address.address_line1.trim() || !address.city.trim() || !address.postal_code.trim()) {
      Alert.alert('Missing information', 'Enter a complete address to continue.');
      return;
    }

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
      router.push(CLINIC_SETUP_PRACTICE);
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
        title="Clinic location"
        subtitle="Where is your practice located?"
        onBack={() => router.back()}
      />
      <SetupStepProgress step={2} total={5} />
      <View style={styles.form}>
        <AddressAutocomplete value={address} onChange={setAddress} />
      </View>
    </OnboardingShell>
  );
}
