import {
  createClinicLocation,
  deactivateClinicLocation,
  isClinicGroupsEnabled,
  updateClinicLocation,
  type ClinicLocation,
} from '@chairside/api';
import { getProvinceLabel } from '@chairside/config';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  AddressAutocomplete,
  createEmptyAddressValue,
  type AddressFormValue,
} from '@/components/clinic/AddressAutocomplete';
import { ClinicLogoAvatar } from '@/components/clinic/ClinicLogoAvatar';
import { ClinicMemberPhotoField } from '@/components/clinic/ClinicMemberPhotoField';
import { CardInfoPanel, CardInfoPanelText } from '@/components/ui/CardInfoPanel';
import { AuthField } from '@/components/onboarding/AuthField';
import { SetupStepFooter } from '@/components/onboarding/SetupStepFooter';
import {
  FieldDivider,
  ProfileDetailStack,
  SectionPanel,
} from '@/components/profile/ProfileDetailBlocks';
import { ProfileDetailScreen } from '@/components/profile/ProfileDetailScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ProfilePhotoCropEditor } from '@/components/worker/ProfilePhotoCropEditor';
import { useClinicProfile } from '@/contexts/ClinicProfileContext';
import { useClinicLogoUri } from '@/hooks/useClinicLogoUri';
import { useClinicMemberPhoto } from '@/hooks/useClinicMemberPhoto';
import { useClinicSetupSave } from '@/hooks/useClinicSetupSave';
import { useClinicUpgradePrompt } from '@/hooks/useClinicUpgradePrompt';
import { AnalyticsEvents } from '@/lib/analytics/events';
import { captureAnalyticsEvent } from '@/lib/analytics/posthog';
import { isClinicBillingFeatureUnlocked } from '@/lib/clinicPlanPresentation';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { formatPhoneNumber, PHONE_NUMBER_PLACEHOLDER } from '@/lib/phone';
import { navigateToClinicProfileHub } from '@/lib/routing';
import { validateAddressStep } from '@/lib/setupStepValidation';
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

function ClinicRow({
  location,
  editable,
  onEdit,
}: {
  location: ClinicLocation;
  editable: boolean;
  onEdit: () => void;
}) {
  const { colors } = useTheme();
  const logoUri = useClinicLogoUri(location.logo_storage_path);
  const styles = useThemedStyles(({ spacing, typography }) => ({
    row: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
      paddingVertical: spacing.xs,
    },
    text: { flex: 1, gap: 2 },
    name: { ...typography.body, fontWeight: '600' as const, color: colors.labelPrimary },
    meta: { fontSize: 13, lineHeight: 18, color: colors.labelSecondary },
  }));

  const address = formatLocationAddress(location);

  const content = (
    <>
      <ClinicLogoAvatar clinicName={location.name} logoUri={logoUri} size={44} />
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {location.name}
        </Text>
        {address ? (
          <Text style={styles.meta} numberOfLines={1}>
            {address}
          </Text>
        ) : null}
      </View>
      {editable ? (
        <Ionicons name="chevron-forward" size={18} color={colors.labelTertiary} />
      ) : null}
    </>
  );

  if (!editable) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${location.name}`}
      onPress={onEdit}
      style={styles.row}>
      {content}
    </Pressable>
  );
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
    membership,
    refreshClinicProfile,
  } = useClinicProfile();
  const { colors } = useTheme();
  const { save: saveClinicProfile } = useClinicSetupSave();
  const {
    photoUri,
    hasPhoto,
    isUploading: isUploadingPhoto,
    cropCandidate,
    pickPhoto,
    cancelCrop,
    confirmCrop,
    removePhoto,
  } = useClinicMemberPhoto();
  const {
    billing,
    isBillingReady,
    upgradePrompt,
    showAddLocationUpgrade,
    handleBillingError,
  } = useClinicUpgradePrompt();
  const groupsEnabled = isClinicGroupsEnabled();
  const canAddLocation = isClinicBillingFeatureUnlocked(
    billing,
    isBillingReady,
    'canAddLocation',
  );

  useEffect(() => {
    if (!isClinicProfileReady) return;
    // Owners can add a second clinic from here (auto-promotes to group).
    // Managers only use this when already on a group account.
    if (!groupsEnabled || (!isOwner && !isGroup)) {
      navigateToClinicProfileHub(router);
    }
  }, [groupsEnabled, isClinicProfileReady, isGroup, isOwner]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState<AddressFormValue>(createEmptyAddressValue());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const [groupNameInput, setGroupNameInput] = useState('');
  const [groupPhone, setGroupPhone] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [showProfileValidation, setShowProfileValidation] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showPhotoSection = isGroup && Boolean(membership?.id);
  const showGroupSection = isGroup && isOwner;

  const initialProfile = useMemo(
    () => ({
      groupName: clinicProfile?.clinic_name?.trim() ?? '',
      groupPhone: clinicProfile?.phone ? formatPhoneNumber(clinicProfile.phone) : '',
    }),
    [clinicProfile?.clinic_name, clinicProfile?.phone],
  );

  useEffect(() => {
    setGroupNameInput(initialProfile.groupName);
    setGroupPhone(initialProfile.groupPhone);
  }, [initialProfile]);

  useEffect(
    () => () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    },
    [],
  );

  const profileDirty =
    showGroupSection &&
    (groupNameInput.trim() !== initialProfile.groupName ||
      groupPhone.trim() !== initialProfile.groupPhone);
  const groupNameInvalid = showGroupSection && !groupNameInput.trim();
  const profileValid = !groupNameInvalid;

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
      alignSelf: 'center' as const,
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

  // After a single clinic becomes a group, its first site still carries the group name.
  const primaryLocation = useMemo(
    () => activeLocations.find((location) => location.is_primary) ?? null,
    [activeLocations],
  );
  const showRenamePrimaryHint = Boolean(
    isOwner &&
      primaryLocation &&
      activeLocations.length >= 2 &&
      clinicProfile?.clinic_name?.trim() &&
      primaryLocation.name.trim().toLowerCase() ===
        clinicProfile.clinic_name.trim().toLowerCase(),
  );

  const listSubtitle = isGroup
    ? isOwner
      ? `${groupName} and the clinics under it.`
      : `The clinics you manage for ${groupName}.`
    : 'Add another clinic when you need a second site.';

  const addressValidation = validateAddressStep(address);
  const canSave = Boolean(name.trim()) && addressValidation.ok;
  const formValidationMessage = !name.trim()
    ? 'Enter a clinic name.'
    : addressValidation.message;

  const resetForm = () => {
    setEditingId(null);
    setShowForm(false);
    setName('');
    setAddress(createEmptyAddressValue());
    setError(null);
    setShowValidation(false);
  };

  const startAdd = () => {
    if (!canAddLocation) {
      showAddLocationUpgrade();
      return;
    }
    setEditingId(null);
    setName('');
    setAddress(createEmptyAddressValue());
    setShowForm(true);
    setError(null);
    setShowValidation(false);
  };

  const startEdit = (location: ClinicLocation) => {
    setEditingId(location.id);
    setShowForm(true);
    setName(location.name);
    setAddress(locationToAddress(location));
    setError(null);
    setShowValidation(false);
  };

  const handleSaveProfile = async () => {
    if (!profileValid) {
      setShowProfileValidation(true);
      return;
    }
    setIsSavingProfile(true);
    setProfileError(null);
    try {
      if (showGroupSection) {
        await saveClinicProfile({
          clinic_name: groupNameInput.trim(),
          phone: groupPhone.trim() || null,
          account_type: 'group',
        });
      }
      await refreshClinicProfile();
      setShowProfileValidation(false);
      setJustSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setJustSaved(false), 2000);
    } catch (saveError) {
      setProfileError(saveError instanceof Error ? saveError.message : 'Could not save changes.');
    } finally {
      setIsSavingProfile(false);
    }
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
      };

      if (editingId) {
        await updateClinicLocation(editingId, payload);
      } else {
        await createClinicLocation(clinicId, {
          ...payload,
          is_primary: activeLocations.length === 0,
        });
        captureAnalyticsEvent(AnalyticsEvents.clinicLocationAddedLater);
      }
      await refreshClinicProfile();
      resetForm();
    } catch (saveError) {
      if (handleBillingError(saveError)) return;
      setError(saveError instanceof Error ? saveError.message : 'Could not save location.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (location: ClinicLocation) => {
    if (activeLocations.length <= 1) {
      setError('Keep at least one active location.');
      return;
    }

    showConfirmActionSheet({
      title: 'Delete location?',
      message: `${location.name} will stop accepting new posts. Existing posts stay in history.`,
      confirmLabel: 'Delete',
      destructive: true,
      onConfirm: async () => {
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
      },
    });
  };

  if (!isClinicProfileReady || !groupsEnabled || (!isOwner && !isGroup)) {
    return null;
  }

  if (showForm && isOwner) {
    return (
      <>
        {upgradePrompt}
        <ProfileDetailScreen
          title={editingId ? 'Edit clinic' : 'Add clinic'}
          subtitle="Name and address for this site — pick it when you post fill-ins."
          onBack={handleBack}>
          <View style={styles.form}>
            <AuthField
              label="Clinic name"
              placeholder="Downtown"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              autoComplete="off"
              icon="business-outline"
              required
              invalid={showValidation && !name.trim()}
            />
            <AddressAutocomplete value={address} onChange={setAddress} required />
            <SetupStepFooter
            canContinue={canSave}
            validationMessage={formValidationMessage}
            showValidation={showValidation}
            submitError={error}
            isSubmitting={isSubmitting}
            continueLabel={editingId ? 'Save changes' : 'Add clinic'}
            onContinue={() => void handleSave()}
          />
          <Pressable style={styles.cancel} onPress={resetForm}>
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>
          {editingId && activeLocations.length > 1 ? (
            <Pressable
              accessibilityRole="button"
              style={styles.danger}
              onPress={() => {
                const target = activeLocations.find((item) => item.id === editingId);
                if (target) handleDelete(target);
              }}>
              <Text style={styles.dangerLabel}>Delete clinic</Text>
            </Pressable>
          ) : null}
        </View>
      </ProfileDetailScreen>
      </>
    );
  }

  return (
    <>
      {upgradePrompt}
      <ProfileDetailScreen
        title={isGroup ? 'Group & clinics' : 'Clinics'}
        subtitle={listSubtitle}
        actionLabel={isOwner ? 'Add clinic' : undefined}
        onActionPress={isOwner ? startAdd : undefined}
        onBack={handleBack}>
        <View style={styles.content}>
          {showPhotoSection || showGroupSection ? (
            <SectionPanel
              icon="business-outline"
              title={showGroupSection ? 'Group' : 'Your photo'}>
              {showPhotoSection ? (
                <ClinicMemberPhotoField
                  displayName={groupNameInput || initialProfile.groupName || 'Group'}
                  photoUri={photoUri}
                  isUploadingPhoto={isUploadingPhoto}
                  hasPhoto={hasPhoto}
                  onPickPhoto={() => void pickPhoto()}
                  onRemovePhoto={() => void removePhoto()}
                />
              ) : null}
              {showGroupSection ? (
                <>
                  <AuthField
                    label="Group name"
                    placeholder="Group or brand name"
                    value={groupNameInput}
                    onChangeText={setGroupNameInput}
                    autoCapitalize="words"
                    autoComplete="off"
                    icon="business-outline"
                    required
                    invalid={showProfileValidation && groupNameInvalid}
                  />
                  <AuthField
                    label="Group phone"
                    placeholder={PHONE_NUMBER_PLACEHOLDER}
                    value={groupPhone}
                    onChangeText={(text) => setGroupPhone(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    icon="call-outline"
                    hint="Cover-request texts for fill-ins go to this number."
                  />
                </>
              ) : null}
              {profileDirty || profileError ? (
                <SetupStepFooter
                  canContinue={profileValid && !isUploadingPhoto}
                  validationMessage="Enter your group name."
                  showValidation={showProfileValidation}
                  submitError={profileError}
                  isSubmitting={isSavingProfile}
                  continueLabel="Save changes"
                  onContinue={() => void handleSaveProfile()}
                />
              ) : justSaved ? (
                <Text style={{ color: colors.success, fontWeight: '600' }}>Saved</Text>
              ) : null}
            </SectionPanel>
          ) : null}

          {error ? (
            <Text style={{ color: colors.destructive, fontWeight: '600' }}>{error}</Text>
          ) : null}

          {showRenamePrimaryHint && primaryLocation ? (
            <CardInfoPanel variant="info" icon="create-outline" title="Name your first clinic">
              <CardInfoPanelText>
                {`Your first site still uses the group name "${primaryLocation.name}". Give it a location name like Downtown so patients and workers can tell your clinics apart.`}
              </CardInfoPanelText>
              <Pressable onPress={() => startEdit(primaryLocation)} accessibilityRole="button">
                <Text style={{ color: colors.primary, fontWeight: '700', marginTop: 4 }}>
                  Rename first clinic
                </Text>
              </Pressable>
            </CardInfoPanel>
          ) : null}

          {visibleLocations.length === 0 ? (
            <EmptyState
              icon="business-outline"
              title={isOwner ? 'No clinics yet' : 'No clinics assigned'}
              message={
                isOwner
                  ? `Add a clinic under ${groupName}.`
                  : 'Ask the owner to assign you to one or more clinics.'
              }
              ctaLabel={isOwner ? 'Add clinic' : undefined}
              onCtaPress={isOwner ? startAdd : undefined}
            />
          ) : (
            <SectionPanel icon="business-outline" title="Clinics">
              <ProfileDetailStack>
                {visibleLocations.map((location, index) => (
                  <View key={location.id}>
                    {index > 0 ? <FieldDivider /> : null}
                    <ClinicRow
                      location={location}
                      editable={isOwner}
                      onEdit={() => startEdit(location)}
                    />
                  </View>
                ))}
              </ProfileDetailStack>
            </SectionPanel>
          )}
        </View>
      </ProfileDetailScreen>
      {cropCandidate ? (
        <ProfilePhotoCropEditor
          visible
          imageUri={cropCandidate.uri}
          imageWidth={cropCandidate.width}
          imageHeight={cropCandidate.height}
          isSaving={isUploadingPhoto}
          onCancel={cancelCrop}
          onConfirm={(transform) => void confirmCrop(transform)}
        />
      ) : null}
    </>
  );
}
