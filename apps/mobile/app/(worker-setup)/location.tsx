import { router } from 'expo-router';
import { WORKER_SETUP_AVAILABILITY } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { Alert, Text, View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useThemedStyles } from '@/theme';

function buildFormattedAddress(
  profile: NonNullable<ReturnType<typeof useWorkerProfile>['workerProfile']>,
): string {
  const cityLine = [profile.city, profile.province, profile.postal_code].filter(Boolean).join(', ');
  return [profile.address_line1, cityLine].filter(Boolean).join(', ');
}

function profileToAddress(
  profile: NonNullable<ReturnType<typeof useWorkerProfile>['workerProfile']>,
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

export default function WorkerLocationScreen() {
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const [address, setAddress] = useState<AddressFormValue>(() =>
    workerProfile ? profileToAddress(workerProfile) : createEmptyAddressValue(),
  );
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
    footer: { gap: spacing.md, marginTop: spacing.lg },
    step: { marginBottom: spacing.sm },
  }));

  useEffect(() => {
    if (workerProfile) {
      setAddress(profileToAddress(workerProfile));
      setBio(workerProfile.bio ?? '');
    }
  }, [workerProfile]);

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
        bio: bio.trim() || null,
      });
      router.push(WORKER_SETUP_AVAILABILITY);
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

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
        title="Location & bio"
        subtitle="Your province determines which roles you can browse."
        onBack={() => router.back()}
      />
      <Text style={styles.step}>Step 4 of 6</Text>
      <View style={styles.form}>
        <AddressAutocomplete value={address} onChange={setAddress} />
        <AuthField
          label="Short bio (optional)"
          placeholder="Optional short bio"
          value={bio}
          onChangeText={setBio}
          autoCapitalize="sentences"
          multiline
        />
      </View>
    </OnboardingShell>
  );
}
