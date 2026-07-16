import {
  createClinicLocation,
  deactivateClinicLocation,
  isClinicGroupsEnabled,
  updateClinicLocation,
  type ClinicLocation,
} from '@chairside/api';
import { SPECIALTY_OPTIONS, getProvinceLabel } from '@chairside/config';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import {
  FieldBlock,
  FieldDivider,
  FieldValue,
  ProfileDetailStack,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { EditPillButton } from '@/components/ui/EditPillButton';
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

function formatLocationAddress(location: ClinicLocation): string {
  return [
    location.address_line1,
    location.address_line2,
    location.city,
    location.province ? getProvinceLabel(location.province) : null,
    location.postal_code,
  ]
    .filter(Boolean)
    .join(', ');
}

async function confirmDeleteLocation(locationName: string): Promise<boolean> {
  const title = 'Delete location?';
  const message = `${locationName} will stop accepting new posts. Existing posts stay in history.`;

  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' ? window.confirm(`${title}\n\n${message}`) : false;
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Delete', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function ClinicLocationsSettingsScreen() {
  const {
    clinicId,
    locations,
    accessibleLocations,
    organization,
    clinicProfile,
    isOwner,
    isGroup,
    isClinicProfileReady,
    refreshClinicProfile,
  } = useClinicProfile();
  const { colors } = useTheme();
  const groupsEnabled = isClinicGroupsEnabled();

  useEffect(() => {
    if (!isClinicProfileReady) return;
    if (!groupsEnabled || !isGroup) {
      navigateToClinicProfileHub(router);
    }
  }, [groupsEnabled, isClinicProfileReady, isGroup]);

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
    form: { gap: spacing.md },
    actions: {
      flexDirection: 'row' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
      marginTop: spacing.sm,
      alignItems: 'center' as const,
    },
    danger: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm,
      minHeight: 36,
      justifyContent: 'center' as const,
    },
    dangerLabel: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.destructive,
    },
    cancel: {
      alignSelf: 'center' as const,
      paddingVertical: spacing.sm,
    },
    cancelLabel: {
      ...typography.subtitle,
      fontSize: 15,
      color: colors.labelSecondary,
      fontWeight: '600' as const,
    },
  }));

  const groupName =
    organization?.name?.trim() || clinicProfile?.clinic_name?.trim() || 'your group';

  const activeLocations = useMemo(
    () => locations.filter((location) => location.is_active),
    [locations],
  );

  // Owners manage every active site; managers only see assigned clinics.
  const visibleLocations = useMemo(
    () =>
      isOwner
        ? activeLocations
        : accessibleLocations.filter((location) => location.is_active),
    [accessibleLocations, activeLocations, isOwner],
  );

  const listSubtitle = isOwner
    ? `All clinics for ${groupName}.`
    : `Clinics you manage for ${groupName}.`;

  const addressValidation = validateAddressStep(address);
  const practiceValidation = validateClinicPracticeStep(practice.softwareUsed);
  const canSave = Boolean(name.trim()) && addressValidation.ok && practiceValidation.ok;
  const formValidationMessage = !name.trim()
    ? 'Enter a location name.'
    : (addressValidation.message ?? practiceValidation.message);

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

  const startAdd = () => {
    setEditingId(null);
    setName('');
    setAddress(createEmptyAddressValue());
    setPractice(EMPTY_LOCATION_PRACTICE_FIELDS);
    setPendingPhoto(null);
    setShowForm(true);
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

  const handleBack = () => {
    if (showForm) {
      resetForm();
      return;
    }
    navigateToClinicProfileHub(router);
  };

  const handleSave = async () => {
    if (!clinicId) return;
    if (!canSave) {
      setShowValidation(true);
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

  const handleDelete = async (location: ClinicLocation) => {
    if (activeLocations.length <= 1) {
      setError('Keep at least one active location.');
      return;
    }

    const confirmed = await confirmDeleteLocation(location.name);
    if (!confirmed) return;

    try {
      setError(null);
      await deactivateClinicLocation(location.id);
      if (editingId === location.id) resetForm();
      await refreshClinicProfile();
    } catch (deleteError) {
      setError(
        deleteError instanceof Error ? deleteError.message : 'Could not delete location.',
      );
    }
  };

  if (!isClinicProfileReady || !groupsEnabled || !isGroup) {
    return null;
  }

  if (showForm && isOwner) {
    return (
      <ProfileDetailScreen
        title={editingId ? 'Edit location' : 'Add location'}
        subtitle="Use the same practice details candidates see on roles and fill-ins."
        onBack={handleBack}>
        <View style={styles.form}>
          <AuthField
            label="Location name"
            placeholder="Downtown clinic"
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
            onUploaded={() => refreshClinicProfile()}
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
            submitError={error}
            isSubmitting={isSubmitting}
            continueLabel={editingId ? 'Save changes' : 'Add location'}
            onContinue={() => void handleSave()}
          />
          <Pressable style={styles.cancel} onPress={resetForm}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
        </View>
      </ProfileDetailScreen>
    );
  }

  return (
    <ProfileDetailScreen
      title="Locations"
      subtitle={listSubtitle}
      actionLabel={isOwner ? 'Add location' : undefined}
      onActionPress={isOwner ? startAdd : undefined}
      onBack={handleBack}>
      <View style={styles.content}>
        {error ? (
          <Text style={{ color: colors.destructive, fontWeight: '600' }}>{error}</Text>
        ) : null}

        {visibleLocations.length === 0 ? (
          <EmptyState
            icon="business-outline"
            title={isOwner ? 'No locations yet' : 'No clinics assigned'}
            message={
              isOwner
                ? `Add the clinics for ${groupName}.`
                : 'Ask the owner to assign you to one or more clinics.'
            }
            ctaLabel={isOwner ? 'Add location' : undefined}
            onCtaPress={isOwner ? startAdd : undefined}
          />
        ) : (
          <ProfileDetailStack>
            {visibleLocations.map((location, index) => (
              <SectionPanel
                key={location.id}
                icon="business-outline"
                stepNumber={index + 1}
                stepAccent={index % 2 === 0 ? 'primary' : 'secondary'}
                title={location.name}>
                <FieldBlock label="Address">
                  <FieldValue value={formatLocationAddress(location) || null} />
                </FieldBlock>
                <FieldDivider />
                <FieldBlock label="Specialty">
                  <FieldValue
                    value={location.specialty ? specialtyLabel(location.specialty) : null}
                  />
                </FieldBlock>
                {isOwner ? (
                  <View style={styles.actions}>
                    <EditPillButton label="Edit" onPress={() => startEdit(location)} />
                    {activeLocations.length > 1 ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Delete ${location.name}`}
                        style={styles.danger}
                        onPress={() => void handleDelete(location)}>
                        <Text style={styles.dangerLabel}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </SectionPanel>
            ))}
          </ProfileDetailStack>
        )}
      </View>
    </ProfileDetailScreen>
  );
}
