import type { ClinicProfile } from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';
import { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { ClinicIdentityHeroCard } from '@/components/clinic/ClinicProfileHero';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import {
  ProfileDetailStack,
  ProfileEmptyState,
  SectionPanel,
  profileSettingsHintStyle,
} from '@/components/profile/ProfileDetailBlocks';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogo } from '@/hooks/useClinicLogo';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { validateAddressStep } from '@/lib/setupStepValidation';
import { useThemedStyles } from '@/theme';

type ClinicPracticeViewProps = {
  profile: ClinicProfile | null;
};

const ADDRESS_KEYS = ['address_line1', 'address_line2', 'city', 'province', 'postal_code'] as const;

function profileToAddress(profile: ClinicProfile): AddressFormValue {
  const address_line1 = profile.address_line1 ?? '';
  const cityLine = [profile.city, profile.province, profile.postal_code].filter(Boolean).join(', ');
  const hasCoordinates = profile.latitude != null && profile.longitude != null;
  return {
    address_line1,
    address_line2: profile.address_line2 ?? '',
    city: profile.city ?? '',
    province: profile.province ?? 'NS',
    postal_code: profile.postal_code ?? '',
    latitude: profile.latitude,
    longitude: profile.longitude,
    formatted: hasCoordinates && address_line1 ? [address_line1, cityLine].filter(Boolean).join(', ') : '',
  };
}

/** Practice details edited inline, matching Group & clinics: save bar appears only when something changed. */
export function ClinicPracticeView({ profile }: ClinicPracticeViewProps) {
  const { isGroup, isOwner } = useClinicProfile();
  const { save } = useClinicSetupSave();
  const { logoUri } = useClinicLogo();
  const styles = useThemedStyles(({ colors, typography }) => ({
    hint: profileSettingsHintStyle({ typography, colors }),
    savedText: {
      color: colors.success,
      fontWeight: '600' as const,
    },
  }));

  const initialName = profile?.clinic_name?.trim() ?? '';
  const initialPhone = profile?.phone ? formatPhoneNumber(profile.phone) : '';
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [address, setAddress] = useState<AddressFormValue>(() =>
    profile ? profileToAddress(profile) : createEmptyAddressValue(),
  );
  const [showValidation, setShowValidation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Re-sync from the saved profile after a save or refresh.
  useEffect(() => {
    setName(initialName);
    setPhone(initialPhone);
    if (profile) setAddress(profileToAddress(profile));
  }, [initialName, initialPhone, profile]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  if (!profile) {
    return (
      <ProfileEmptyState
        icon="business-outline"
        title="Add practice details"
        description="Add your clinic name, phone, and address to start posting."
      />
    );
  }

  const original = profileToAddress(profile);
  const addressChanged = ADDRESS_KEYS.some(
    (key) => (address[key] ?? '').trim() !== (original[key] ?? '').trim(),
  );
  const isDirty = name.trim() !== initialName || phone.trim() !== initialPhone || addressChanged;

  const nameInvalid = !name.trim();
  // Posting needs a phone too (isClinicProfileComplete), so it is required here.
  const phoneInvalid = !phone.trim();
  const addressValidation = validateAddressStep(address);
  const canSave = !nameInvalid && !phoneInvalid && addressValidation.ok && isOwner && !isSaving;
  const validationMessage = nameInvalid
    ? 'Enter your clinic name.'
    : phoneInvalid
      ? 'Enter your clinic phone.'
      : addressValidation.message;

  const handleSave = async () => {
    if (!canSave) {
      setShowValidation(true);
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    try {
      await save({
        clinic_name: name.trim(),
        phone: phone.trim() || null,
        address_line1: address.address_line1.trim(),
        address_line2: address.address_line2.trim() || null,
        city: address.city.trim(),
        province: address.province.trim() || 'NS',
        postal_code: address.postal_code.trim(),
        latitude: address.latitude,
        longitude: address.longitude,
        account_type: isGroup ? 'group' : 'individual',
      });
      setShowValidation(false);
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 2000);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const clinicName = profile.clinic_name?.trim() || 'Your practice';
  const locationLabel = [profile.city, profile.province ? getProvinceLabel(profile.province) : null]
    .filter(Boolean)
    .join(', ');

  return (
    <ProfileDetailStack>
      <ClinicIdentityHeroCard
        clinicName={clinicName}
        logoUri={logoUri}
        specialtyLabel={null}
        locationLabel={locationLabel || null}
        emptyMetaFallback="Add your clinic address."
      />

      <SectionPanel icon="call-outline" title="Contact">
        <Text style={styles.hint}>
          Your clinic name and phone. Cover-request texts for fill-ins go to this number.
        </Text>
        <AuthField
          label="Clinic name"
          placeholder="Clinic name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
          autoComplete="off"
          required
          validated={!nameInvalid}
          invalid={showValidation && nameInvalid}
        />
        <AuthField
          label="Phone"
          placeholder={PHONE_NUMBER_PLACEHOLDER}
          value={phone}
          onChangeText={(text) => setPhone(formatPhoneNumber(text))}
          keyboardType="phone-pad"
          required
          validated={!phoneInvalid}
          invalid={showValidation && phoneInvalid}
        />
      </SectionPanel>

      <SectionPanel icon="location-outline" title="Location">
        <Text style={styles.hint}>Where your practice is based. Shown on fill-ins and roles.</Text>
        <AddressAutocomplete value={address} onChange={setAddress} required />
      </SectionPanel>

      {isDirty || saveError ? (
        <SetupStepFooter
          canContinue={canSave}
          validationMessage={validationMessage}
          showValidation={showValidation}
          submitError={saveError}
          isSubmitting={isSaving}
          continueLabel="Save changes"
          onContinue={() => void handleSave()}
        />
      ) : justSaved ? (
        <Text style={styles.savedText}>Saved</Text>
      ) : null}
    </ProfileDetailStack>
  );
}
