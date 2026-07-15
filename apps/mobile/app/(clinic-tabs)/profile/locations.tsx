import {
  createClinicLocation,
  deactivateClinicLocation,
  updateClinicLocation,
  type ClinicLocation,
} from '@chairside/api';
import { SPECIALTY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import {
  ClinicLocationFormFields,
  EMPTY_LOCATION_PRACTICE_FIELDS,
  type ClinicLocationPracticeFields,
} from '@/components/clinic/ClinicLocationFormFields';
import {
  ClinicLocationPhotoField,
  type PendingLocationPhoto,
  uploadPendingLocationPhoto,
} from '@/components/clinic/ClinicLocationPhotoField';
import { AuthField } from '@/components/onboarding/AuthField';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { formatPhoneNumber } from '@/lib/phone';
import { navigateToClinicProfileHub } from '@/lib/routing';
import {
  validateAddressStep,
  validateClinicPracticeStep,
} from '@/lib/setupStepValidation';
import { useTheme, useThemedStyles } from '@/theme';

function locationToAddress(location: ClinicLocation): AddressFormValue {
  return {
    address_line1: location.address_line1 ?? '',
    address_line2: location.address_line2 ?? '',
    city: location.city ?? '',
    province: location.province ?? 'NS',
    postal_code: location.postal_code ?? '',
    latitude: location.latitude,
    longitude: location.longitude,
    formatted: [location.address_line1, location.city].filter(Boolean).join(', '),
  };
}

function locationToPractice(location: ClinicLocation): ClinicLocationPracticeFields {
  return {
    phone: location.phone ? formatPhoneNumber(location.phone) : '',
    specialty: (location.specialty as ClinicLocationPracticeFields['specialty']) || 'general',
    softwareUsed: location.software_used ?? [],
    operatories: location.operatories_count?.toString() ?? '',
    teamSizeRange:
      (location.team_size_range as ClinicLocationPracticeFields['teamSizeRange']) ?? null,
  };
}

function specialtyLabel(specialty: string): string {
  return SPECIALTY_OPTIONS.find((item) => item.value === specialty)?.label ?? specialty;
}

export default function ClinicLocationsSettingsScreen() {
  const { clinicId, locations, isOwner, refreshClinicProfile } = useClinicProfile();
  const { colors } = useTheme();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState<AddressFormValue>(createEmptyAddressValue());
  const [practice, setPractice] = useState<ClinicLocationPracticeFields>(
    EMPTY_LOCATION_PRACTICE_FIELDS,
  );
  const [pendingPhoto, setPendingPhoto] = useState<PendingLocationPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    content: { gap: spacing.lg },
    list: { gap: spacing.sm },
    title: { ...typography.body, fontWeight: '600' as const },
    meta: typography.subtitle,
    actions: { flexDirection: 'row' as const, gap: spacing.md, marginTop: spacing.sm },
    action: { color: colors.primary, fontWeight: '600' as const },
    danger: { color: colors.destructive, fontWeight: '600' as const },
    form: { gap: spacing.md },
    error: { ...typography.subtitle, color: colors.destructive },
  }));

  const activeLocations = useMemo(
    () => locations.filter((location) => location.is_active),
    [locations],
  );

  if (!isOwner) {
    return (
      <ProfileDetailScreen onBack={() => navigateToClinicProfileHub(router)}>
        <EmptyState
          icon="lock-closed-outline"
          title="Owner access only"
          message="Only the clinic owner can manage locations."
        />
      </ProfileDetailScreen>
    );
  }

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setName('');
    setAddress(createEmptyAddressValue());
    setPractice(EMPTY_LOCATION_PRACTICE_FIELDS);
    setPendingPhoto(null);
    setError(null);
    setShowValidation(false);
  };

  const startEdit = (location: ClinicLocation) => {
    setEditingId(location.id);
    setShowForm(true);
    setName(location.name);
    setAddress(locationToAddress(location));
    setPractice(locationToPractice(location));
    setPendingPhoto(null);
    setError(null);
    setShowValidation(false);
  };

  const handleSave = async () => {
    if (!clinicId) return;
    const addressValidation = validateAddressStep(address);
    const practiceValidation = validateClinicPracticeStep(practice.softwareUsed);
    if (!name.trim() || !addressValidation.ok || !practiceValidation.ok) {
      setShowValidation(true);
      setError(
        !name.trim()
          ? 'Enter a location name.'
          : (addressValidation.message ?? practiceValidation.message),
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        address_line1: address.address_line1.trim(),
        address_line2: address.address_line2.trim() || null,
        city: address.city.trim(),
        province: address.province,
        postal_code: address.postal_code.trim(),
        latitude: address.latitude,
        longitude: address.longitude,
        phone: practice.phone.trim() || null,
        specialty: practice.specialty,
        software_used: practice.softwareUsed,
        operatories_count: practice.operatories ? Number(practice.operatories) : null,
        team_size_range: practice.teamSizeRange,
      };

      if (editingId) {
        await updateClinicLocation(editingId, payload);
        if (pendingPhoto) {
          await uploadPendingLocationPhoto({
            organizationId: clinicId,
            locationId: editingId,
            pending: pendingPhoto,
            existingStoragePath: activeLocations.find((item) => item.id === editingId)
              ?.logo_storage_path,
          });
        }
      } else {
        const created = await createClinicLocation(clinicId, {
          ...payload,
          is_primary: activeLocations.length === 0,
        });
        if (pendingPhoto) {
          await uploadPendingLocationPhoto({
            organizationId: clinicId,
            locationId: created.id,
            pending: pendingPhoto,
          });
        }
      }
      await refreshClinicProfile();
      resetForm();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = (location: ClinicLocation) => {
    Alert.alert(
      'Deactivate location?',
      `${location.name} will stop accepting new posts. Existing posts stay in history.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: () => {
            void deactivateClinicLocation(location.id)
              .then(() => refreshClinicProfile())
              .catch((deactivateError) => {
                setError(
                  deactivateError instanceof Error
                    ? deactivateError.message
                    : 'Could not deactivate location.',
                );
              });
          },
        },
      ],
    );
  };

  return (
    <ProfileDetailScreen onBack={() => navigateToClinicProfileHub(router)}>
      <View style={styles.content}>
        {activeLocations.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="No locations yet"
            message="Add the clinic locations your team posts for."
            ctaLabel="Add location"
            onCtaPress={() => setShowForm(true)}
          />
        ) : (
          <View style={styles.list}>
            {activeLocations.map((location) => (
              <SurfaceCard key={location.id}>
                <Text style={styles.title}>
                  {location.name}
                </Text>
                <Text style={styles.meta}>
                  {[location.address_line1, location.city, location.province]
                    .filter(Boolean)
                    .join(', ')}
                  {location.specialty ? ` · ${specialtyLabel(location.specialty)}` : ''}
                </Text>
                <View style={styles.actions}>
                  <Pressable onPress={() => startEdit(location)}>
                    <Text style={styles.action}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => handleDeactivate(location)}>
                    <Text style={styles.danger}>Deactivate</Text>
                  </Pressable>
                </View>
              </SurfaceCard>
            ))}
            <Pressable onPress={() => {
              setEditingId(null);
              setName('');
              setAddress(createEmptyAddressValue());
              setPractice(EMPTY_LOCATION_PRACTICE_FIELDS);
              setPendingPhoto(null);
              setShowForm(true);
              setError(null);
            }}>
              <Text style={styles.action}>Add location</Text>
            </Pressable>
          </View>
        )}

        {showForm ? (
          <View style={styles.form}>
            <AuthField
              label="Location name"
              placeholder="Downtown clinic"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="off"
            />
            <ClinicLocationPhotoField
              organizationId={clinicId}
              locationId={editingId}
              locationName={name.trim() || 'Clinic'}
              logoStoragePath={
                editingId
                  ? activeLocations.find((item) => item.id === editingId)?.logo_storage_path
                  : null
              }
              pendingPhoto={pendingPhoto}
              onPendingPhotoChange={setPendingPhoto}
              onUploaded={() => refreshClinicProfile()}
            />
            <AddressAutocomplete value={address} onChange={setAddress} />
            <ClinicLocationFormFields
              values={practice}
              onChange={setPractice}
              showValidation={showValidation}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable disabled={isSubmitting} onPress={() => void handleSave()}>
                <Text style={styles.action}>{isSubmitting ? 'Saving…' : 'Save location'}</Text>
              </Pressable>
              <Pressable onPress={resetForm}>
                <Text style={styles.meta}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </View>
    </ProfileDetailScreen>
  );
}
