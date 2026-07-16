import {
  createPracticeDoctor,
  formatPracticeDoctorSummary,
  isDuplicatePracticeDoctor,
  newPracticeDoctorId,
  type PracticeDoctor,
} from '@chairside/config';
import {
  deletePracticeDoctorPhoto,
  uploadPracticeDoctorPhotoFromBase64,
} from '@chairside/api';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { PracticeDoctorEditSheet } from '@/components/clinic/PracticeDoctorEditSheet';
import { PracticeDoctorFormFields } from '@/components/clinic/PracticeDoctorFormFields';
import { PracticeDoctorAvatar } from '@/components/clinic/PracticeDoctorAvatar';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useAuth } from '@/contexts/AuthContext';
import { usePracticeDoctorPhotoUri } from '@/hooks/usePracticeDoctorPhotoUri';
import { pickDoctorPhotoFromLibrary } from '@/lib/pickDoctorPhotoFromLibrary';
import {
  webHover,
  webListRowHoverStyles,
  webPointer,
} from '@/lib/webPressableStyles';
import { fontSemibold, useTheme, useThemedStyles } from '@/theme';

export type PracticeDoctorLocation = {
  id: string;
  name: string;
};

type PracticeDoctorsInputProps = {
  value: PracticeDoctor[];
  onChange: (doctors: PracticeDoctor[]) => void;
  locations?: PracticeDoctorLocation[];
};

function formatDoctorLocationNames(
  doctor: PracticeDoctor,
  locationsById: Map<string, string>,
): string | null {
  const names = (doctor.location_ids ?? [])
    .map((id) => locationsById.get(id))
    .filter((name): name is string => Boolean(name));
  if (names.length === 0) return null;
  return names.join(' · ');
}

function PracticeDoctorListItem({
  doctor,
  locationLabel,
  onPress,
}: {
  doctor: PracticeDoctor;
  locationLabel: string | null;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const photoUri = usePracticeDoctorPhotoUri(doctor.photo_storage_path);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    itemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.separator,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      ...webPointer(),
    },
    itemRowHovered: webListRowHoverStyles(colors),
    itemRowPressed: {
      opacity: 0.88,
    },
    itemTextBlock: {
      flex: 1,
      minWidth: 0,
      gap: 2,
      paddingTop: 2,
    },
    itemName: {
      ...typography.body,
      fontFamily: fontSemibold,
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.labelPrimary,
    },
    itemTitle: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
    },
    itemBio: {
      ...typography.subtitle,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    chevron: {
      marginTop: 12,
    },
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${doctor.name}`}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.itemRow,
        webHover(hovered, pressed, styles.itemRowHovered),
        pressed && styles.itemRowPressed,
      ]}>
      <PracticeDoctorAvatar name={doctor.name} photoUri={photoUri ?? undefined} size={44} />
      <View style={styles.itemTextBlock}>
        <Text style={styles.itemName} numberOfLines={2}>
          {doctor.name}
        </Text>
        {doctor.title ? (
          <Text style={styles.itemTitle} numberOfLines={2}>
            {doctor.title}
          </Text>
        ) : null}
        {locationLabel ? (
          <Text style={styles.itemTitle} numberOfLines={2}>
            {locationLabel}
          </Text>
        ) : null}
        {doctor.bio ? (
          <Text style={styles.itemBio} numberOfLines={2}>
            {doctor.bio}
          </Text>
        ) : null}
      </View>
      <Ionicons
        name="chevron-forward"
        size={16}
        color={colors.labelTertiary}
        style={styles.chevron}
      />
    </Pressable>
  );
}

export function PracticeDoctorsInput({
  value,
  onChange,
  locations = [],
}: PracticeDoctorsInputProps) {
  const { user } = useAuth();
  const clinicId = user?.id;
  const [nameDraft, setNameDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [locationIdsDraft, setLocationIdsDraft] = useState<string[]>([]);
  const [draftDoctorId, setDraftDoctorId] = useState(() => newPracticeDoctorId());
  const [draftPhotoPreviewUri, setDraftPhotoPreviewUri] = useState<string | null>(null);
  const [draftPhotoBase64, setDraftPhotoBase64] = useState<string | null>(null);
  const [draftPhotoContentType, setDraftPhotoContentType] = useState<string | null>(null);
  const [isAddingDoctor, setIsAddingDoctor] = useState(false);
  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);

  const editingDoctor = value.find((doctor) => doctor.id === editingDoctorId) ?? null;

  const locationOptions = useMemo(
    () => locations.map((location) => ({ value: location.id, label: location.name })),
    [locations],
  );
  const locationsById = useMemo(
    () => new Map(locations.map((location) => [location.id, location.name])),
    [locations],
  );
  const requireLocationAssignment = locationOptions.length > 0;

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    wrap: {
      gap: spacing.md,
    },
    header: {
      gap: spacing.xs,
    },
    label: {
      ...typography.body,
      fontWeight: '600',
    },
    hint: typography.subtitle,
    count: {
      ...typography.subtitle,
      fontSize: 13,
      fontWeight: '600',
      color: colors.labelSecondary,
    },
    composer: {
      gap: spacing.sm,
      backgroundColor: colors.backgroundGrouped,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.separator,
      padding: spacing.md,
    },
    listSection: {
      gap: spacing.sm,
    },
    list: {
      maxHeight: 360,
    },
    listContent: {
      gap: spacing.sm,
    },
    empty: {
      ...typography.subtitle,
      fontSize: 13,
      fontStyle: 'italic',
    },
  }));

  const resetComposer = () => {
    setNameDraft('');
    setTitleDraft('');
    setBioDraft('');
    setLocationIdsDraft([]);
    setDraftDoctorId(newPracticeDoctorId());
    setDraftPhotoPreviewUri(null);
    setDraftPhotoBase64(null);
    setDraftPhotoContentType(null);
  };

  const handlePickDraftPhoto = async () => {
    const picked = await pickDoctorPhotoFromLibrary();
    if (!picked) return;

    setDraftPhotoPreviewUri(picked.previewUri);
    setDraftPhotoBase64(picked.base64);
    setDraftPhotoContentType(picked.contentType);
  };

  const addDoctor = async () => {
    if (!clinicId) return;

    const name = nameDraft.trim().replace(/\s+/g, ' ');
    const title = titleDraft.trim().replace(/\s+/g, ' ');

    if (!name) {
      Alert.alert('Doctor name required', 'Enter the doctor’s name before adding them.');
      return;
    }

    if (requireLocationAssignment && locationIdsDraft.length === 0) {
      Alert.alert('Select a location', 'Choose at least one location where this doctor works.');
      return;
    }

    const candidate = createPracticeDoctor({
      id: draftDoctorId,
      name,
      title: title || null,
      bio: bioDraft,
      location_ids: locationIdsDraft,
    });

    if (isDuplicatePracticeDoctor(value, candidate)) {
      Alert.alert('Already added', `${formatPracticeDoctorSummary(candidate)} is already on the list.`);
      return;
    }

    setIsAddingDoctor(true);
    try {
      let photo_storage_path: string | null = null;

      if (draftPhotoBase64 && draftPhotoContentType) {
        const { storagePath } = await uploadPracticeDoctorPhotoFromBase64(
          clinicId,
          candidate.id,
          draftPhotoBase64,
          draftPhotoContentType,
        );
        photo_storage_path = storagePath;
      }

      onChange([...value, { ...candidate, photo_storage_path }]);
      resetComposer();
    } catch (error) {
      Alert.alert(
        'Could not add doctor',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsAddingDoctor(false);
    }
  };

  const removeDoctor = (doctor: PracticeDoctor) => {
    if (doctor.photo_storage_path) {
      void deletePracticeDoctorPhoto(doctor.photo_storage_path).catch(() => undefined);
    }

    onChange(value.filter((item) => item.id !== doctor.id));
  };

  const saveDoctor = (nextDoctor: PracticeDoctor) => {
    onChange(value.map((doctor) => (doctor.id === nextDoctor.id ? nextDoctor : doctor)));
  };

  const canAdd =
    nameDraft.trim().length > 0 &&
    !isAddingDoctor &&
    (!requireLocationAssignment || locationIdsDraft.length > 0);

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Doctors at your practice (optional)</Text>
        <Text style={styles.hint}>
          {requireLocationAssignment
            ? 'Add doctors and assign the locations where they work. Shared doctors can select more than one.'
            : 'Help candidates see who they would be working with. Add as many doctors as you like.'}
        </Text>
      </View>

      <View style={styles.composer}>
        <PracticeDoctorFormFields
          name={nameDraft}
          title={titleDraft}
          bio={bioDraft}
          photoUri={draftPhotoPreviewUri}
          isPhotoLoading={isAddingDoctor}
          locationOptions={locationOptions}
          selectedLocationIds={locationIdsDraft}
          onLocationIdsChange={setLocationIdsDraft}
          onPickPhoto={() => void handlePickDraftPhoto()}
          onNameChange={setNameDraft}
          onTitleChange={setTitleDraft}
          onBioChange={setBioDraft}
        />
        <OnboardingButton
          label={isAddingDoctor ? 'Adding…' : 'Add doctor'}
          variant="secondary"
          disabled={!canAdd}
          onPress={() => void addDoctor()}
        />
      </View>

      {value.length > 0 ? (
        <View style={styles.listSection}>
          <Text style={styles.count}>
            {value.length} doctor{value.length === 1 ? '' : 's'} added
          </Text>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled">
            {value.map((doctor) => (
              <PracticeDoctorListItem
                key={doctor.id}
                doctor={doctor}
                locationLabel={formatDoctorLocationNames(doctor, locationsById)}
                onPress={() => setEditingDoctorId(doctor.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : (
        <Text style={styles.empty}>No doctors added yet. You can skip this or add them anytime.</Text>
      )}

      <PracticeDoctorEditSheet
        visible={editingDoctor != null}
        doctor={editingDoctor}
        clinicId={clinicId}
        allDoctors={value}
        locationOptions={locationOptions}
        requireLocationAssignment={requireLocationAssignment}
        onClose={() => setEditingDoctorId(null)}
        onSave={saveDoctor}
        onRemove={removeDoctor}
      />
    </View>
  );
}
