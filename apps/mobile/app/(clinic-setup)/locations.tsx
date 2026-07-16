import {
  createClinicLocation,
  deactivateClinicLocation,
  deleteIncompleteGroupLocationStubs,
  listClinicLocations,
  updateClinicLocation,
  type ClinicLocation,
} from '@chairside/api';
import { SPECIALTY_OPTIONS } from '@chairside/config';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, Pressable, Text, View } from 'react-native';

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
import { AuthScreenHeader } from '@/components/onboarding/AuthScreenHeader';
import { OnboardingShell } from '@/components/onboarding/OnboardingShell';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import { SetupStepProgress } from '@/components/onboarding/SetupStepProgress';
import { EmptyState } from '@/components/ui/EmptyState';
import { SurfaceCard } from '@/components/ui/SurfaceCard';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { formatPhoneNumber } from '@/lib/phone';
import { CLINIC_SETUP_PRACTICE, CLINIC_SETUP_TEAM } from '@/lib/routing';
import { getClinicSetupStepNumber } from '@/lib/clinicSetupSteps';
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

export default function ClinicLocationsSetupScreen() {
  const { clinicId, clinicProfile, isGroup, refreshClinicProfile } = useClinicProfile();
  const { colors } = useTheme();
  const progress = getClinicSetupStepNumber('locations', true);
  const [locations, setLocations] = useState<ClinicLocation[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState<AddressFormValue>(createEmptyAddressValue());
  const [practice, setPractice] = useState<ClinicLocationPracticeFields>(
    EMPTY_LOCATION_PRACTICE_FIELDS,
  );
  const [pendingPhoto, setPendingPhoto] = useState<PendingLocationPhoto | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showForm, setShowForm] = useState(true);

  const styles = useThemedStyles(({ spacing, typography }) => ({
    form: { gap: spacing.md },
    list: { gap: spacing.sm },
    cardTitle: { ...typography.body, fontWeight: '600' as const },
    cardMeta: typography.subtitle,
    cardActions: {
      flexDirection: 'row' as const,
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    addButton: {
      paddingVertical: spacing.sm,
      alignItems: 'center' as const,
    },
    addLabel: { ...typography.body, color: colors.primary, fontWeight: '600' as const },
    danger: { ...typography.body, color: colors.destructive, fontWeight: '600' as const },
  }));

  const activeLocations = useMemo(
    () => locations.filter((location) => location.is_active),
    [locations],
  );

  const reload = useCallback(async () => {
    if (!clinicId) return;
    await deleteIncompleteGroupLocationStubs(clinicId);
    const next = await listClinicLocations(clinicId);
    setLocations(next);
    const active = next.filter((location) => location.is_active);
    if (active.length === 0) {
      setShowForm(true);
    }
  }, [clinicId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const addressValidation = validateAddressStep(address);
  const practiceValidation = validateClinicPracticeStep(practice.softwareUsed);
  const canSave =
    Boolean(name.trim()) && addressValidation.ok && practiceValidation.ok;

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setAddress(createEmptyAddressValue());
    setPractice(EMPTY_LOCATION_PRACTICE_FIELDS);
    setPendingPhoto(null);
    setShowValidation(false);
    setSubmitError(null);
  };

  const startEdit = (location: ClinicLocation) => {
    setEditingId(location.id);
    setShowForm(true);
    setName(location.name);
    setAddress(locationToAddress(location));
    setPractice(locationToPractice(location));
    setPendingPhoto(null);
    setSubmitError(null);
    setShowValidation(false);
  };

  const startAdd = () => {
    resetForm();
    setShowForm(true);
  };

  const handleSaveLocation = async () => {
    if (!clinicId) return;
    if (!canSave) {
      setShowValidation(true);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
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

      resetForm();
      await reload();
      await refreshClinicProfile();
      setShowForm(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not save location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (location: ClinicLocation) => {
    if (activeLocations.length <= 1) {
      setSubmitError('Keep at least one location to continue.');
      return;
    }

    const title = 'Delete location?';
    const message = `${location.name} will stop accepting new posts. Existing posts stay in history.`;
    const confirmed =
      Platform.OS === 'web'
        ? typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)
        : await new Promise<boolean>((resolve) => {
            Alert.alert(title, message, [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
            ]);
          });
    if (!confirmed) return;

    try {
      await deactivateClinicLocation(location.id);
      if (editingId === location.id) resetForm();
      await reload();
      await refreshClinicProfile();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Could not delete location.');
    }
  };

  const handleContinue = () => {
    if (activeLocations.length === 0) {
      setShowValidation(true);
      setShowForm(true);
      setSubmitError('Add at least one location to continue.');
      return;
    }
    router.push(CLINIC_SETUP_TEAM);
  };

  if (!isGroup) {
    router.replace(CLINIC_SETUP_PRACTICE);
    return null;
  }

  const formValidationMessage =
    !name.trim()
      ? 'Enter a location name.'
      : addressValidation.message ?? practiceValidation.message;

  return (
    <OnboardingShell
      atmosphere="form"
      footer={
        <SetupStepFooter
          canContinue={activeLocations.length > 0}
          validationMessage="Add at least one clinic location."
          showValidation={showValidation && activeLocations.length === 0}
          submitError={submitError}
          isSubmitting={isSubmitting}
          continueLabel="Continue"
          onContinue={handleContinue}
        />
      }>
      <AuthScreenHeader
        title="Clinic locations"
        subtitle="Add each clinic with the same details you’d use for a single practice."
        onBack={() => router.back()}
      />
      <SetupStepProgress step={progress.step} total={progress.total} />
      <View style={styles.form}>
        {activeLocations.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title="Add your first location"
            message="Groups need at least one clinic location before going live."
          />
        ) : (
          <View style={styles.list}>
            {activeLocations.map((location) => (
              <SurfaceCard key={location.id}>
                <Pressable onPress={() => startEdit(location)}>
                  <Text style={styles.cardTitle}>
                    {location.name}
                  </Text>
                  <Text style={styles.cardMeta}>
                    {[location.city, location.province].filter(Boolean).join(', ') ||
                      'Address pending'}
                    {location.specialty
                      ? ` · ${specialtyLabel(location.specialty)}`
                      : ''}
                  </Text>
                </Pressable>
                <View style={styles.cardActions}>
                  <Pressable onPress={() => startEdit(location)}>
                    <Text style={styles.addLabel}>Edit</Text>
                  </Pressable>
                  {activeLocations.length > 1 ? (
                    <Pressable onPress={() => void handleDelete(location)}>
                      <Text style={styles.danger}>Delete</Text>
                    </Pressable>
                  ) : null}
                </View>
              </SurfaceCard>
            ))}
          </View>
        )}

        {showForm ? (
          <View style={styles.form}>
            <AuthField
              label="Location name"
              placeholder={
                clinicProfile?.clinic_name
                  ? `${clinicProfile.clinic_name} — Downtown`
                  : 'Downtown clinic'
              }
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="off"
              invalid={showValidation && !name.trim()}
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
              onUploaded={async () => {
                await reload();
                await refreshClinicProfile();
              }}
            />
            <AddressAutocomplete value={address} onChange={setAddress} />
            <ClinicLocationFormFields
              values={practice}
              onChange={setPractice}
              showValidation={showValidation}
            />
            <SetupStepFooter
              canContinue={canSave}
              validationMessage={formValidationMessage}
              showValidation={showValidation}
              submitError={null}
              isSubmitting={isSubmitting}
              continueLabel={editingId ? 'Save changes' : 'Add location'}
              onContinue={handleSaveLocation}
            />
            {editingId || activeLocations.length > 0 ? (
              <Pressable
                style={styles.addButton}
                onPress={() => {
                  resetForm();
                  setShowForm(false);
                }}>
                <Text style={styles.cardMeta}>Cancel</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Pressable style={styles.addButton} onPress={startAdd}>
            <Text style={styles.addLabel}>Add another location</Text>
          </Pressable>
        )}
      </View>
    </OnboardingShell>
  );
}
