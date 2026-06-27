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
import { useEffect, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PracticeDoctorFormFields } from '@/components/clinic/PracticeDoctorFormFields';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { usePracticeDoctorPhotoUri } from '@/hooks/usePracticeDoctorPhotoUri';
import { showConfirmActionSheet } from '@/lib/confirmActionSheet';
import { pickDoctorPhotoFromLibrary } from '@/lib/pickDoctorPhotoFromLibrary';
import { useThemedStyles } from '@/theme';

type PracticeDoctorEditSheetProps = {
  visible: boolean;
  doctor: PracticeDoctor | null;
  clinicId: string | undefined;
  allDoctors: PracticeDoctor[];
  onClose: () => void;
  onSave: (doctor: PracticeDoctor) => void;
  onRemove: (doctor: PracticeDoctor) => void;
};

export function PracticeDoctorEditSheet({
  visible,
  doctor,
  clinicId,
  allDoctors,
  onClose,
  onSave,
  onRemove,
}: PracticeDoctorEditSheetProps) {
  const insets = useSafeAreaInsets();
  const storedPhotoUri = usePracticeDoctorPhotoUri(doctor?.photo_storage_path);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [photoPreviewUri, setPhotoPreviewUri] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [photoContentType, setPhotoContentType] = useState<string | null>(null);
  const [photoStoragePath, setPhotoStoragePath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible || !doctor) return;

    setName(doctor.name);
    setTitle(doctor.title ?? '');
    setBio(doctor.bio ?? '');
    setPhotoPreviewUri(null);
    setPhotoBase64(null);
    setPhotoContentType(null);
    setPhotoStoragePath(doctor.photo_storage_path);
  }, [doctor, visible]);

  const styles = useThemedStyles(({ colors, spacing, typography }) => ({
    root: {
      flex: 1,
      justifyContent: 'flex-end',
    },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: Math.max(insets.bottom, spacing.lg),
      maxHeight: '92%',
    },
    scroll: {
      flexGrow: 0,
      flexShrink: 1,
    },
    scrollContent: {
      gap: spacing.lg,
    },
    handle: {
      alignSelf: 'center',
      width: 36,
      height: 4,
      borderRadius: 999,
      backgroundColor: colors.separator,
      marginBottom: spacing.md,
    },
    title: {
      ...typography.body,
      fontSize: 17,
      fontWeight: '600',
    },
    footer: {
      gap: spacing.sm,
      paddingTop: spacing.md,
    },
  }));

  const dismissKeyboard = () => Keyboard.dismiss();

  const handleClose = () => {
    dismissKeyboard();
    onClose();
  };

  const handlePickPhoto = async () => {
    const picked = await pickDoctorPhotoFromLibrary();
    if (!picked) return;

    setPhotoPreviewUri(picked.previewUri);
    setPhotoBase64(picked.base64);
    setPhotoContentType(picked.contentType);
  };

  const handleSave = async () => {
    if (!doctor || !clinicId) return;

    const trimmedName = name.trim().replace(/\s+/g, ' ');
    if (!trimmedName) {
      Alert.alert('Doctor name required', 'Enter the doctor’s name before saving.');
      return;
    }

    const candidate = createPracticeDoctor({
      id: doctor.id,
      name: trimmedName,
      title: title.trim() || null,
      bio,
      photo_storage_path: photoStoragePath,
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
  const canSave = name.trim().length > 0 && !isSaving;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={styles.backdrop}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Close edit doctor sheet"
        />

        <Pressable style={styles.sheet} onPress={dismissKeyboard}>
          <View style={styles.handle} />

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            bounces={false}>
            <Text style={styles.title}>Edit doctor</Text>

            <PracticeDoctorFormFields
              name={name}
              title={title}
              bio={bio}
              photoUri={displayPhotoUri}
              isPhotoLoading={isSaving}
              onPickPhoto={() => void handlePickPhoto()}
              onNameChange={setName}
              onTitleChange={setTitle}
              onBioChange={setBio}
            />

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
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}
