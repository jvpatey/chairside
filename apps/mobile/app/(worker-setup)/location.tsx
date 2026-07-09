import { router } from 'expo-router';
import { WORKER_SETUP_REVIEW } from '@/lib/routing';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { AuthField } from '@/components/onboarding/AuthField';
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkerProfile } from '@/contexts/WorkerProfileContext';
import { useWorkerSetupSave } from '@/hooks/useWorkerSetupSave';
import { useWorkerSetupStepGuard } from '@/hooks/useSetupStepGuard';
import { useSetupEditMode } from '@/hooks/useSetupEditMode';
import { validateAddressStep } from '@/lib/setupStepValidation';
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
  const { profile } = useAuth();
  const { workerProfile, isWorkerProfileReady } = useWorkerProfile();
  const { save } = useWorkerSetupSave();
  const { isEditMode, exitHref } = useSetupEditMode({ role: 'worker' });
  const [address, setAddress] = useState<AddressFormValue>(() =>
    workerProfile ? profileToAddress(workerProfile) : createEmptyAddressValue(),
  );
  const [bio, setBio] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useWorkerSetupStepGuard('location', workerProfile, profile?.display_name, isWorkerProfileReady, isEditMode);

  const validation = validateAddressStep(address);

  const styles = useThemedStyles(({ spacing }) => ({
    form: { gap: spacing.md },
  }));

  useEffect(() => {
    if (workerProfile) {
      setAddress(profileToAddress(workerProfile));
      setBio(workerProfile.bio ?? '');
    }
  }, [workerProfile]);

  const handleContinue = async () => {
    if (!validation.ok) return;

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
        bio: bio.trim() || null,
      });
      if (isEditMode) {
        router.replace(exitHref);
      } else {
        router.push(WORKER_SETUP_REVIEW);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isWorkerProfileReady) return null;

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={validation.ok}
          validationMessage={validation.message}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel={isEditMode ? 'Save changes' : 'Continue'}
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title="Professional background · Location & bio"
        subtitle="Your province determines which roles you can browse."
        onBack={() => (isEditMode ? router.replace(exitHref) : router.back())}
      />
      {!isEditMode ? <SetupStepProgress step={4} total={5} /> : null}
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
