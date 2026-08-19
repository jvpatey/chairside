import {
  createPracticeDoctor,
  formatPracticeDoctorSummary,
  isDuplicatePracticeDoctor,
  type PracticeDoctor,
} from '@chairside/config';
import {
  deletePracticeDoctorPhoto,
  uploadPracticeDoctorPhotoFromBase64,
} from '@chairside/api';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  PracticeDoctorFormFields,
  type PracticeDoctorLocationOption,
} from '@/components/clinic/PracticeDoctorFormFields';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { ProfilePhotoCropEditor } from '@/components/worker/ProfilePhotoCropEditor';
import { usePracticeDoctorPhotoUri } from '@/hooks/usePracticeDoctorPhotoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { cropProfilePhotoToBase64 } from '@/lib/cropProfilePhoto';
import {
  adaptiveSheetFooter,
  adaptiveSheetHeader,
  adaptiveSheetRoot,
  adaptiveSheetScroll,
  adaptiveSheetScrollContent,
  adaptiveSheetTitle,
} from '@/lib/adaptiveSheetBodyStyles';
import {
  pickDoctorPhotoFromLibrary,
  type DoctorPhotoCropCandidate,
} from '@/lib/pickDoctorPhotoFromLibrary';
import {
  PROFILE_PHOTO_CROP_VIEWPORT,
  type ProfilePhotoCropTransform,
} from '@/lib/profilePhotoCrop';
import { useThemedStyles } from '@/theme';

export type PracticeDoctorEditSheetProps = {
  visible: boolean;
  doctor: PracticeDoctor | null;
  clinicId: string | undefined;
  allDoctors: PracticeDoctor[];
  locationOptions?: PracticeDoctorLocationOption[];
  requireLocationAssignment?: boolean;
  onClose: () => void;
  onSave: (doctor: PracticeDoctor) => void;
  onRemove: (doctor: PracticeDoctor) => void;
  variant?: 'sheet' | 'dialog';
};

export function PracticeDoctorEditSheetBody({
  visible,
  doctor,
  clinicId,
  allDoctors,
  locationOptions = [],
  requireLocationAssignment = false,
  onClose,
  onSave,
  onRemove,
  variant = 'sheet',
}: PracticeDoctorEditSheetProps) {
  const isDialog = variant === 'dialog';
  const storedPhotoUri = usePracticeDoctorPhotoUri(doctor?.photo_storage_path);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [locationIds, setLocationIds] = useState<string[]>([]);
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoContentType, setPhotoContentType] = useState<string | null>(null);
  const [photoStoragePath, setPhotoStoragePath] = useState<string | null>(null);
  const [cropCandidate, setCropCandidate] = useState<DoctorPhotoCropCandidate | null>(null);
  const [isCroppingPhoto, setIsCroppingPhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const validLocationIds = useMemo(
    () => new Set(locationOptions.map((option) => option.value)),
    [locationOptions],
  );

  useEffect(() => {
    if (!visible || !doctor) return;

    setName(doctor.name);
    setTitle(doctor.title ?? '');
    setBio(doctor.bio ?? '');
    setLocationIds(
      (doctor.location_ids ?? []).filter((id) => validLocationIds.has(id) || locationOptions.length === 0),
    );
    setPhotoPreviewUri(null);
    setPhotoBase64(null);
    setPhotoContentType(null);
    setPhotoStoragePath(doctor.photo_storage_path);
    setCropCandidate(null);
  }, [doctor, visible, validLocationIds, locationOptions.length]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      gap: spacing.md,
      ...adaptiveSheetRoot(isDialog),
    },
    header: {
      paddingBottom: isDialog ? spacing.md : 0,
      ...adaptiveSheetHeader(isDialog, colors),
    },
    scroll: adaptiveSheetScroll(isDialog, 560),
    scrollContent: adaptiveSheetScrollContent(isDialog, { gap: spacing.lg }),
    title: adaptiveSheetTitle(isDialog, colors, {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    }),
    footer: {
      gap: spacing.sm,
      paddingTop: isDialog ? spacing.sm : spacing.md,
      ...adaptiveSheetFooter(isDialog, colors),
    },
  }));

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClose = () => {
    dismissKeyboard();
    onClose();
  };

  const handlePickPhoto = async () => {
    const candidate = await pickDoctorPhotoFromLibrary();
    if (!candidate) return;
    setCropCandidate(candidate);
  };

  const handleConfirmCrop = async (transform: ProfilePhotoCropTransform) => {
    if (!cropCandidate) return;

    setIsCroppingPhoto(true);
    try {
      const cropped = await cropProfilePhotoToBase64(
        cropCandidate.uri,
        cropCandidate.width,
        cropCandidate.height,
        PROFILE_PHOTO_CROP_VIEWPORT,
        transform,
      );
      setPhotoPreviewUri(`data:${cropped.mimeType};base64,${cropped.base64}`);
      setPhotoBase64(cropped.base64);
      setPhotoContentType(cropped.mimeType);
      setCropCandidate(null);
    } catch (error) {
      Alert.alert(
        'Could not crop photo',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsCroppingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!doctor || !clinicId) return;

    const trimmedName = name.trim().replace(/\s+/g, ' ');
    if (!trimmedName) {
      Alert.alert('Doctor name required', 'Enter the doctor’s name before saving.');
      return;
    }

    if (requireLocationAssignment && locationOptions.length > 0 && locationIds.length === 0) {
      Alert.alert('Select a location', 'Choose at least one location where this doctor works.');
      return;
    }

    const candidate = createPracticeDoctor({
      id: doctor.id,
      name: trimmedName,
      title: title.trim() || null,
      bio,
      photo_storage_path: photoStoragePath,
      location_ids: locationIds,
    });

    if (isDuplicatePracticeDoctor(allDoctors, candidate, doctor.id)) {
      Alert.alert(
        'Already added',
        `${formatPracticeDoctorSummary(candidate)} is already on the list.`,
      );
      return;
    }

    setIsSaving(true);
    try {
      let nextPhotoPath = photoStoragePath;

      if (photoBase64 && photoContentType) {
        const { storagePath } = await uploadPracticeDoctorPhotoFromBase64(
          clinicId,
          doctor.id,
          photoBase64,
          photoContentType,
          photoStoragePath,
        );
        nextPhotoPath = storagePath;
      }

      onSave({ ...candidate, photo_storage_path: nextPhotoPath });
      handleClose();
    } catch (error) {
      Alert.alert(
        'Could not save',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    if (!doctor) return;

    showConfirmActionSheet({
      title: 'Remove doctor?',
      message: `Remove ${formatPracticeDoctorSummary(doctor)} from your practice profile?`,
      confirmLabel: 'Remove',
      destructive: true,
      onConfirm: async () => {
        if (doctor.photo_storage_path) {
          await deletePracticeDoctorPhoto(doctor.photo_storage_path).catch(() => undefined);
        }
        onRemove(doctor);
        handleClose();
      },
    });
  };

  const displayPhotoUri = photoPreviewUri ?? storedPhotoUri;
  const canSave =
    name.trim().length > 0 &&
    !isSaving &&
    (!requireLocationAssignment || locationOptions.length === 0 || locationIds.length > 0);

  if (!doctor) return null;

  return (
    <>
      <Pressable style={styles.root} onPress={dismissKeyboard}>
        <View style={styles.header}>
          <Text style={styles.title}>Edit doctor</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}>
          <PracticeDoctorFormFields
            name={name}
            title={title}
            bio={bio}
            photoUri={displayPhotoUri}
            isPhotoLoading={isSaving || isCroppingPhoto}
            locationOptions={locationOptions}
            selectedLocationIds={locationIds}
            onLocationIdsChange={setLocationIds}
            onPickPhoto={() => void handlePickPhoto()}
            onNameChange={setName}
            onTitleChange={setTitle}
            onBioChange={setBio}
          />
        </ScrollView>

        <View style={styles.footer}>
          <OnboardingButton
            label={isSaving ? 'Saving…' : 'Save changes'}
            disabled={!canSave}
            onPress={() => void handleSave()}
          />
          <OnboardingButton
            label="Remove doctor"
            variant="destructive"
            disabled={isSaving}
            onPress={handleRemove}
          />
          <OnboardingButton label="Cancel" variant="ghost" onPress={handleClose} />
        </View>
      </Pressable>

      {cropCandidate ? (
        <ProfilePhotoCropEditor
          visible
          imageUri={cropCandidate.uri}
          imageWidth={cropCandidate.width}
          imageHeight={cropCandidate.height}
          isSaving={isCroppingPhoto}
          onCancel={() => setCropCandidate(null)}
          onConfirm={(transform) => void handleConfirmCrop(transform)}
        />
      ) : null}
    </>
  );
}
